// POST /calculate-job-match  { job_id: string }
//
// Computes (or recomputes) the compatibility score between the caller and a
// job, combining deterministic rules with one AI contextual assessment
// (spec section 12). See _shared/matching/computeAndSaveMatch.ts for the
// actual scoring + persistence logic, shared with discover-jobs.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceRoleClient, createUserClient } from '../_shared/supabaseClient.ts'
import { AnthropicProvider } from '../_shared/ai/anthropic.ts'
import { computeAndSaveMatch } from '../_shared/matching/computeAndSaveMatch.ts'

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

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not configured')
      return jsonResponse({ error: "Le fournisseur IA n'est pas configuré" }, 500)
    }

    const matchResult = await computeAndSaveMatch({
      userClient,
      serviceClient: createServiceRoleClient(),
      provider: new AnthropicProvider(apiKey),
      userId: user.id,
      job,
    })

    if (!matchResult) {
      return jsonResponse(
        { error: 'Analysez votre CV principal avant de calculer un score de compatibilité' },
        422,
      )
    }

    return jsonResponse({ match: matchResult })
  } catch (error) {
    console.error('calculate-job-match failed', error)
    return jsonResponse({ error: 'Erreur interne lors du calcul du score' }, 500)
  }
})
