import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { AIProvider } from '../ai/types.ts'
import { RssJobSourceConnector } from './rssConnector.ts'
import { computeAndSaveMatch } from '../matching/computeAndSaveMatch.ts'

// Caps how many newly discovered jobs get an AI match computed synchronously
// per run, to keep execution time and API cost bounded.
const MAX_AUTO_MATCH_PER_RUN = 10

export type NewMatch = { jobId: string; jobTitle: string; company: string; overallScore: number }

export type DiscoveryResult = {
  jobsFound: number
  jobsProcessed: number
  jobsMatched: number
  errors: string[]
  newMatches: NewMatch[]
}

// Core discovery + auto-match pipeline, shared by the user-triggered
// discover-jobs Edge Function and the cron-triggered scheduled-job-search
// one. `userClient` is RLS-scoped to a real user for an interactive call;
// for a scheduled run there is no user session, so the same service-role
// client is passed for both `userClient` and `serviceClient` — service role
// bypasses RLS entirely, so reading a specific user's rows by `user_id`
// still works correctly, it's just no longer RLS-enforced (appropriate here
// since this path never touches the network on the user's behalf without
// going through this trusted, secret-gated function).
export async function runDiscoveryForUser(params: {
  userClient: SupabaseClient
  serviceClient: SupabaseClient
  // Ingestion (fetch + dedupe + insert) never needs AI and always runs.
  // Auto-matching needs a configured provider — pass null to skip it
  // (e.g. ANTHROPIC_API_KEY not set yet) without failing the whole run.
  provider: AIProvider | null
  userId: string
}): Promise<DiscoveryResult> {
  const { userClient, serviceClient, provider, userId } = params

  let jobsFound = 0
  let jobsProcessed = 0
  let jobsMatched = 0
  const errors: string[] = []
  const newMatches: NewMatch[] = []
  const newlyInsertedJobs: {
    id: string
    title: string
    company: string
    description: string | null
    requirements: string | null
    location: string | null
    ai_analysis: unknown
  }[] = []

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

  if (!provider && newlyInsertedJobs.length > 0) {
    errors.push('AI matching skipped: ANTHROPIC_API_KEY not configured')
  }

  if (provider) {
    for (const job of newlyInsertedJobs.slice(0, MAX_AUTO_MATCH_PER_RUN)) {
      try {
        const result = await computeAndSaveMatch({ userClient, serviceClient, provider, userId, job })
        if (result) {
          jobsMatched++
          newMatches.push({ jobId: job.id, jobTitle: job.title, company: job.company, overallScore: result.overall_score })
        }
      } catch (matchError) {
        errors.push(`match ${job.title}: ${matchError instanceof Error ? matchError.message : String(matchError)}`)
      }
    }
  }

  return { jobsFound, jobsProcessed, jobsMatched, errors, newMatches }
}
