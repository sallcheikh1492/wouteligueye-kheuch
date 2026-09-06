// POST /discover-jobs  (no body)
//
// Runs the discovery pipeline for the calling user (spec section 10):
// load active sources -> fetch postings -> normalize -> dedupe -> insert
// new jobs -> auto-score a bounded number of them against the caller's
// profile. Every run is logged to agent_runs (agent_type = 'job_discovery').
// See _shared/discovery/runDiscoveryForUser.ts for the pipeline itself,
// shared with the cron-triggered scheduled-job-search.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceRoleClient, createUserClient } from '../_shared/supabaseClient.ts'
import { AnthropicProvider } from '../_shared/ai/anthropic.ts'
import { runDiscoveryForUser } from '../_shared/discovery/runDiscoveryForUser.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401)
  }

  const userClient = createUserClient(authHeader)
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()
  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const serviceClient = createServiceRoleClient()

  const { data: run, error: runError } = await serviceClient
    .from('agent_runs')
    .insert({ user_id: user.id, agent_type: 'job_discovery', status: 'running' })
    .select()
    .single()
  if (runError || !run) {
    console.error('Failed to create agent_runs row', runError)
    return jsonResponse({ error: "Impossible de démarrer l'agent de découverte" }, 500)
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      throw new Error("Le fournisseur IA n'est pas configuré")
    }

    const result = await runDiscoveryForUser({
      userClient,
      serviceClient,
      provider: new AnthropicProvider(apiKey),
      userId: user.id,
    })

    await serviceClient
      .from('agent_runs')
      .update({
        status: result.errors.length > 0 ? 'partial' : 'completed',
        completed_at: new Date().toISOString(),
        jobs_found: result.jobsFound,
        jobs_processed: result.jobsProcessed,
        jobs_matched: result.jobsMatched,
        errors: result.errors,
      })
      .eq('id', run.id)

    return jsonResponse({
      jobs_found: result.jobsFound,
      jobs_processed: result.jobsProcessed,
      jobs_matched: result.jobsMatched,
      run_id: run.id,
    })
  } catch (error) {
    console.error('discover-jobs failed', error)
    await serviceClient
      .from('agent_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : String(error)],
      })
      .eq('id', run.id)
    return jsonResponse({ error: 'Erreur interne lors de la découverte des offres' }, 500)
  }
})
