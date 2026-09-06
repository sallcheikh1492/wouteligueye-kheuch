// POST /optimize-cv  { job_id: string }
//
// Tailors the caller's primary CV to a specific job: reorders/rewords
// existing skills and experience, never inventing anything (enforced both
// by the prompt and by a deterministic post-processing guard). Saves the
// result as a generated_documents row and bumps an early-stage application
// to "documents_ready", same as generate-cover-letter.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createUserClient } from '../_shared/supabaseClient.ts'
import { AnthropicProvider } from '../_shared/ai/anthropic.ts'
import type { CVAnalysis } from '../_shared/ai/types.ts'

const EARLY_STATUSES = ['discovered', 'reviewing', 'interested']

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
      .select('id, title, description')
      .eq('id', jobId)
      .single()
    if (jobError || !job) {
      return jsonResponse({ error: 'Job not found' }, 404)
    }

    const { data: cv, error: cvError } = await userClient
      .from('cvs')
      .select('id, parsed_data')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle()
    if (cvError) {
      console.error('Failed to load primary CV', cvError)
      return jsonResponse({ error: 'Impossible de charger votre CV principal' }, 500)
    }
    if (!cv || !cv.parsed_data) {
      return jsonResponse({ error: 'Analysez votre CV principal avant de l’optimiser' }, 422)
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not configured')
      return jsonResponse({ error: "Le fournisseur IA n'est pas configuré" }, 500)
    }

    const provider = new AnthropicProvider(apiKey)
    const cvAnalysis = cv.parsed_data as unknown as CVAnalysis

    const optimized = await provider.optimizeCV({
      cvAnalysis,
      jobTitle: job.title,
      jobDescription: job.description ?? '',
    })

    const { data: existingApplication } = await userClient
      .from('applications')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .maybeSingle()

    const { data: document, error: documentError } = await userClient
      .from('generated_documents')
      .insert({
        user_id: user.id,
        job_id: jobId,
        application_id: existingApplication?.id ?? null,
        type: 'optimized_cv',
        content: optimized.summary,
        metadata: {
          highlighted_skills: optimized.highlighted_skills,
          reordered_experience: optimized.reordered_experience,
        },
      })
      .select()
      .single()
    if (documentError) {
      console.error('Failed to save optimized CV', documentError)
      return jsonResponse({ error: "Échec de l'enregistrement du CV optimisé" }, 500)
    }

    if (existingApplication && EARLY_STATUSES.includes(existingApplication.status)) {
      const { error: statusError } = await userClient
        .from('applications')
        .update({ status: 'documents_ready' })
        .eq('id', existingApplication.id)
      if (statusError) console.error('Failed to update application status', statusError)
    }

    return jsonResponse({ optimized, document })
  } catch (error) {
    console.error('optimize-cv failed', error)
    return jsonResponse({ error: "Erreur interne lors de l'optimisation du CV" }, 500)
  }
})
