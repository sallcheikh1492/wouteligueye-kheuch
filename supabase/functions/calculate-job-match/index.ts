// POST /calculate-job-match  { job_id: string }
//
// Computes (or recomputes) the compatibility score between the caller and a
// job, combining deterministic rules with one AI contextual assessment
// (spec section 12), and upserts the result into job_matches. Ensures the
// job has a cached analyze-job result first.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceRoleClient, createUserClient } from '../_shared/supabaseClient.ts'
import { AnthropicProvider } from '../_shared/ai/anthropic.ts'
import { ensureJobAnalysis } from '../_shared/matching/ensureJobAnalysis.ts'
import type { CVAnalysis } from '../_shared/ai/types.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401)
    }

    let body: { job_id?: unknown }
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }
    const jobId = body.job_id
    if (typeof jobId !== 'string' || !jobId) {
      return jsonResponse({ error: 'job_id is required' }, 400)
    }

    const userClient = createUserClient(authHeader)
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()
    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const { data: job, error: jobError } = await userClient
      .from('jobs')
      .select('id, title, company, description, requirements, location, ai_analysis')
      .eq('id', jobId)
      .single()
    if (jobError || !job) {
      return jsonResponse({ error: 'Job not found' }, 404)
    }

    const { data: cv, error: cvError } = await userClient
      .from('cvs')
      .select('parsed_data, raw_text')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle()
    if (cvError) {
      console.error('Failed to load primary CV', cvError)
      return jsonResponse({ error: 'Impossible de charger votre CV principal' }, 500)
    }
    if (!cv || !cv.parsed_data) {
      return jsonResponse(
        { error: 'Analysez votre CV principal avant de calculer un score de compatibilité' },
        422,
      )
    }

    const { data: skillRows, error: skillsError } = await userClient
      .from('skills')
      .select('name')
      .eq('user_id', user.id)
    if (skillsError) {
      console.error('Failed to load skills', skillsError)
      return jsonResponse({ error: 'Impossible de charger vos compétences' }, 500)
    }

    const { data: prefs, error: prefsError } = await userClient
      .from('job_preferences')
      .select('preferred_locations, remote_preference')
      .eq('user_id', user.id)
      .maybeSingle()
    if (prefsError) {
      console.error('Failed to load job preferences', prefsError)
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not configured')
      return jsonResponse({ error: "Le fournisseur IA n'est pas configuré" }, 500)
    }

    const provider = new AnthropicProvider(apiKey)
    const serviceClient = createServiceRoleClient()

    const jobAnalysis = await ensureJobAnalysis(serviceClient, provider, job)

    const preferredLocations = Array.isArray(prefs?.preferred_locations)
      ? (prefs!.preferred_locations as string[])
      : []

    const matchResult = await provider.calculateMatch({
      cvAnalysis: cv.parsed_data as unknown as CVAnalysis,
      cvRawText: cv.raw_text ?? '',
      userSkills: (skillRows ?? []).map((s) => s.name),
      jobAnalysis,
      jobDescription: job.description ?? '',
      jobLocation: job.location,
      preferredLocations,
      remotePreference: prefs?.remote_preference ?? 'any',
    })

    // job_matches has no INSERT/UPDATE policy for regular users by design
    // (matches are always computed server-side) — the write goes through
    // the service role, scoped explicitly to this user_id/job_id pair.
    const { error: upsertError } = await serviceClient.from('job_matches').upsert(
      {
        job_id: jobId,
        user_id: user.id,
        overall_score: matchResult.overall_score,
        skills_score: matchResult.skills_score,
        experience_score: matchResult.experience_score,
        education_score: matchResult.education_score,
        location_score: matchResult.location_score,
        keywords_score: matchResult.keywords_score,
        ai_analysis: {
          ai_context_score: matchResult.ai_context_score,
          reasoning_summary: matchResult.reasoning_summary,
          weights: { skills: 0.35, experience: 0.2, education: 0.15, location: 0.1, keywords: 0.1, ai_context: 0.1 },
        },
        missing_skills: matchResult.missing_skills,
        strengths: matchResult.strengths,
        recommendation: matchResult.recommendation,
      },
      { onConflict: 'job_id,user_id' },
    )
    if (upsertError) {
      console.error('Failed to persist job match', upsertError)
      return jsonResponse({ error: "Échec de l'enregistrement du score" }, 500)
    }

    return jsonResponse({ match: matchResult })
  } catch (error) {
    console.error('calculate-job-match failed', error)
    return jsonResponse({ error: 'Erreur interne lors du calcul du score' }, 500)
  }
})
