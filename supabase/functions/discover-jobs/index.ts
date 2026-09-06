// POST /discover-jobs  (no body)
//
// Runs the discovery pipeline for the calling user (spec section 10):
// load active sources -> fetch postings -> normalize -> dedupe -> insert
// new jobs -> auto-score a bounded number of them against the caller's
// profile. Every run is logged to agent_runs (agent_type = 'job_discovery').
//
// jobs/job_sources are shared, non-user-owned tables with no write policy
// for regular users, so ingestion goes through the service role; the run's
// bookkeeping (agent_runs) is scoped to the calling user, since discovery is
// triggered per-user (manually today, on a schedule once scheduled-job-search
// ships) even though the postings it finds benefit every user.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceRoleClient, createUserClient } from '../_shared/supabaseClient.ts'
import { AnthropicProvider } from '../_shared/ai/anthropic.ts'
import { RssJobSourceConnector } from '../_shared/discovery/rssConnector.ts'
import { computeAndSaveMatch } from '../_shared/matching/computeAndSaveMatch.ts'

// Caps how many newly discovered jobs get an AI match computed synchronously
// in this request, to keep the function responsive and bound API cost.
const MAX_AUTO_MATCH_PER_RUN = 10

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

  let jobsFound = 0
  let jobsProcessed = 0
  let jobsMatched = 0
  const errors: string[] = []
  const newlyInsertedJobs: { id: string; title: string; company: string; description: string | null; requirements: string | null; location: string | null; ai_analysis: unknown }[] = []

  try {
    const { data: sources, error: sourcesError } = await serviceClient
      .from('job_sources')
      .select('*')
      .eq('is_active', true)
      .eq('type', 'rss_feed')
    if (sourcesError) throw sourcesError

    const connector = new RssJobSourceConnector()

    for (const source of sources ?? []) {
      try {
        const items = await connector.fetchJobs({ url: source.url })
        jobsFound += items.length

        for (const item of items) {
          const { data: existing } = await serviceClient
            .from('jobs')
            .select('id')
            .eq('source_id', source.id)
            .eq('external_id', item.externalId)
            .maybeSingle()
          if (existing) continue

          const { data: inserted, error: insertError } = await serviceClient
            .from('jobs')
            .insert({
              source_id: source.id,
              external_id: item.externalId,
              title: item.title,
              company: item.company,
              location: item.location ?? null,
              description: item.description ?? null,
              application_url: item.applicationUrl ?? null,
              published_at: item.publishedAt ?? null,
              status: 'active',
            })
            .select('id, title, company, description, requirements, location, ai_analysis')
            .single()
          if (insertError || !inserted) {
            errors.push(`${source.name}: ${insertError?.message ?? 'insert failed'}`)
            continue
          }
          jobsProcessed++
          newlyInsertedJobs.push(inserted)
        }

        await serviceClient
          .from('job_sources')
          .update({ last_checked_at: new Date().toISOString() })
          .eq('id', source.id)
      } catch (sourceError) {
        errors.push(`${source.name}: ${sourceError instanceof Error ? sourceError.message : String(sourceError)}`)
      }
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (apiKey && newlyInsertedJobs.length > 0) {
      const provider = new AnthropicProvider(apiKey)
      for (const job of newlyInsertedJobs.slice(0, MAX_AUTO_MATCH_PER_RUN)) {
        try {
          const result = await computeAndSaveMatch({ userClient, serviceClient, provider, userId: user.id, job })
          if (result) jobsMatched++
        } catch (matchError) {
          errors.push(`match ${job.title}: ${matchError instanceof Error ? matchError.message : String(matchError)}`)
        }
      }
    }

    await serviceClient
      .from('agent_runs')
      .update({
        status: errors.length > 0 ? 'partial' : 'completed',
        completed_at: new Date().toISOString(),
        jobs_found: jobsFound,
        jobs_processed: jobsProcessed,
        jobs_matched: jobsMatched,
        errors,
      })
      .eq('id', run.id)

    return jsonResponse({ jobs_found: jobsFound, jobs_processed: jobsProcessed, jobs_matched: jobsMatched, run_id: run.id })
  } catch (error) {
    console.error('discover-jobs failed', error)
    await serviceClient
      .from('agent_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        jobs_found: jobsFound,
        jobs_processed: jobsProcessed,
        jobs_matched: jobsMatched,
        errors: [...errors, error instanceof Error ? error.message : String(error)],
      })
      .eq('id', run.id)
    return jsonResponse({ error: 'Erreur interne lors de la découverte des offres' }, 500)
  }
})
