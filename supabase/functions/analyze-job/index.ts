// POST /analyze-job  { job_id: string }
//
// Extracts structured requirements from a job posting and caches the result
// on jobs.ai_analysis. Any authenticated user may trigger this (jobs are
// shared, publicly-readable data) but the cache write goes through the
// service role, since regular users cannot write to the jobs table.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceRoleClient, createUserClient } from '../_shared/supabaseClient.ts'
import { AnthropicProvider } from '../_shared/ai/anthropic.ts'
import { ensureJobAnalysis } from '../_shared/matching/ensureJobAnalysis.ts'

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
      .select('id, title, company, description, requirements, ai_analysis')
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

    const provider = new AnthropicProvider(apiKey)
    const serviceClient = createServiceRoleClient()
    const analysis = await ensureJobAnalysis(serviceClient, provider, job)

    return jsonResponse({ analysis })
  } catch (error) {
    console.error('analyze-job failed', error)
    return jsonResponse({ error: "Erreur interne lors de l'analyse de l'offre" }, 500)
  }
})
