import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { AIProvider } from '../ai/types.ts'
import { RssJobSourceConnector } from './rssConnector.ts'
import { searchJobsViaOpenAI } from './openaiWebSearch.ts'
import type { DiscoveredJob } from './types.ts'
import { computeAndSaveMatch } from '../matching/computeAndSaveMatch.ts'

type InsertedJob = {
  id: string
  title: string
  company: string
  description: string | null
  requirements: string | null
  location: string | null
  ai_analysis: unknown
}

type InsertResult = { job: InsertedJob; isDuplicate: boolean }

// Shared by both the RSS and AI-web-search branches below. First dedupes
// exactly on (source_id, external_id) — re-ingesting the same item from the
// same source. Then checks for a fuzzy cross-source duplicate (the same
// posting found via a different feed, or via AI web search) using
// find_duplicate_job (trigram similarity on title/company — see
// 20260907030000_job_duplicate_detection.sql): if one is found, the row is
// still inserted for provenance but flagged status='duplicate' and linked
// via duplicate_of_id, so the caller can skip spending an AI match on it.
async function insertIfNew(
  serviceClient: SupabaseClient,
  sourceId: string,
  sourceName: string,
  item: DiscoveredJob,
  errors: string[],
): Promise<InsertResult | null> {
  const { data: existing } = await serviceClient
    .from('jobs')
    .select('id')
    .eq('source_id', sourceId)
    .eq('external_id', item.externalId)
    .maybeSingle()
  if (existing) return null

  const { data: duplicateOfId } = await serviceClient.rpc('find_duplicate_job', {
    p_source_id: sourceId,
    p_title: item.title,
    p_company: item.company,
  })

  const { data: inserted, error: insertError } = await serviceClient
    .from('jobs')
    .insert({
      source_id: sourceId,
      external_id: item.externalId,
      title: item.title,
      company: item.company,
      location: item.location ?? null,
      description: item.description ?? null,
      application_url: item.applicationUrl ?? null,
      published_at: item.publishedAt ?? null,
      status: duplicateOfId ? 'duplicate' : 'active',
      duplicate_of_id: duplicateOfId ?? null,
    })
    .select('id, title, company, description, requirements, location, ai_analysis')
    .single()
  if (insertError || !inserted) {
    errors.push(`${sourceName}: ${insertError?.message ?? 'insert failed'}`)
    return null
  }
  return { job: inserted, isDuplicate: !!duplicateOfId }
}

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
  // Optional: powers the opt-in AI web-search branch below. Pass null to
  // skip it (e.g. OPENAI_API_KEY not configured) without failing the run.
  openaiApiKey: string | null
  userId: string
}): Promise<DiscoveryResult> {
  const { userClient, serviceClient, provider, openaiApiKey, userId } = params

  let jobsFound = 0
  let jobsProcessed = 0
  let jobsMatched = 0
  const errors: string[] = []
  const newMatches: NewMatch[] = []
  const newlyInsertedJobs: InsertedJob[] = []

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
        const result = await insertIfNew(serviceClient, source.id, source.name, item, errors)
        if (result) {
          jobsProcessed++
          if (!result.isDuplicate) newlyInsertedJobs.push(result.job)
        }
      }

      await serviceClient
        .from('job_sources')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', source.id)
    } catch (sourceError) {
      errors.push(`${source.name}: ${sourceError instanceof Error ? sourceError.message : String(sourceError)}`)
    }
  }

  if (openaiApiKey) {
    const { data: prefs } = await serviceClient
      .from('job_preferences')
      .select('desired_titles, preferred_locations, keywords, web_search_enabled')
      .eq('user_id', userId)
      .maybeSingle()

    const desiredTitles = Array.isArray(prefs?.desired_titles) ? (prefs.desired_titles as string[]) : []

    if (prefs?.web_search_enabled && desiredTitles.length > 0) {
      const { data: webSource } = await serviceClient
        .from('job_sources')
        .select('id, name')
        .eq('type', 'ai_web_search')
        .maybeSingle()

      if (webSource) {
        try {
          const items = await searchJobsViaOpenAI({
            apiKey: openaiApiKey,
            desiredTitles,
            preferredLocations: Array.isArray(prefs.preferred_locations) ? (prefs.preferred_locations as string[]) : [],
            keywords: Array.isArray(prefs.keywords) ? (prefs.keywords as string[]) : [],
          })
          jobsFound += items.length

          for (const item of items) {
            const result = await insertIfNew(serviceClient, webSource.id, webSource.name, item, errors)
            if (result) {
              jobsProcessed++
              if (!result.isDuplicate) newlyInsertedJobs.push(result.job)
            }
          }

          await serviceClient
            .from('job_sources')
            .update({ last_checked_at: new Date().toISOString() })
            .eq('id', webSource.id)
        } catch (searchError) {
          errors.push(`Recherche web IA: ${searchError instanceof Error ? searchError.message : String(searchError)}`)
        }
      }
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
