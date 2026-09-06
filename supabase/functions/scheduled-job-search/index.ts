// POST /scheduled-job-search  (no body — triggered by pg_cron, see
// supabase/scheduling.sql)
//
// Polls which users are due for a search given their
// job_preferences.search_frequency and the last time this ran for them,
// then runs the discovery + matching pipeline for each (spec section 17).
// Notifies the user (spec section 20) for every match scoring 80+.
//
// Gated by CRON_SECRET, not a user JWT: there is no logged-in user in a
// cron context, and every operation here needs the service role anyway
// (writing to jobs/job_matches/notifications, reading across users).
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceRoleClient } from '../_shared/supabaseClient.ts'
import { verifyCronSecret } from '../_shared/cronAuth.ts'
import { AnthropicProvider } from '../_shared/ai/anthropic.ts'
import { runDiscoveryForUser } from '../_shared/discovery/runDiscoveryForUser.ts'
import { sendNotification } from '../_shared/notifications/sendNotification.ts'

const FREQUENCY_MS: Record<string, number> = {
  every_6_hours: 6 * 60 * 60 * 1000,
  every_12_hours: 12 * 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
}

// Bounds how many users one invocation processes; the 30-minute poll (see
// supabase/scheduling.sql) picks up anyone left over on the next run.
const MAX_USERS_PER_RUN = 20

// A match this good is always worth an immediate notification, regardless
// of the user's own minimum_match_score filter for browsing the Jobs page.
const NOTIFY_SCORE_THRESHOLD = 80

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }
  if (!verifyCronSecret(req)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const serviceClient = createServiceRoleClient()
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not configured')
    return jsonResponse({ error: "Le fournisseur IA n'est pas configuré" }, 500)
  }
  const provider = new AnthropicProvider(apiKey)

  const { data: preferences, error: prefsError } = await serviceClient
    .from('job_preferences')
    .select('user_id, search_frequency')
  if (prefsError) {
    console.error('Failed to load job preferences', prefsError)
    return jsonResponse({ error: 'Impossible de charger les préférences utilisateurs' }, 500)
  }

  const dueUsers: { userId: string; frequency: string }[] = []
  for (const pref of preferences ?? []) {
    // N+1 by design at this scale — see README for the scaling note before
    // this ever needs to serve more than a few hundred users.
    const { data: lastRun } = await serviceClient
      .from('agent_runs')
      .select('started_at')
      .eq('user_id', pref.user_id)
      .eq('agent_type', 'scheduled_job_search')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const thresholdMs = FREQUENCY_MS[pref.search_frequency] ?? FREQUENCY_MS.daily
    const isDue = !lastRun || Date.now() - new Date(lastRun.started_at).getTime() >= thresholdMs
    if (isDue) dueUsers.push({ userId: pref.user_id, frequency: pref.search_frequency })
  }

  const usersToProcess = dueUsers.slice(0, MAX_USERS_PER_RUN)
  let usersProcessed = 0
  let usersFailed = 0

  for (const { userId } of usersToProcess) {
    const { data: run, error: runError } = await serviceClient
      .from('agent_runs')
      .insert({ user_id: userId, agent_type: 'scheduled_job_search', status: 'running' })
      .select()
      .single()
    if (runError || !run) {
      console.error('Failed to create agent_runs row', runError)
      usersFailed++
      continue
    }

    try {
      const result = await runDiscoveryForUser({
        userClient: serviceClient, // no user session in a cron context — see file header
        serviceClient,
        provider,
        userId,
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

      for (const match of result.newMatches) {
        if (match.overallScore < NOTIFY_SCORE_THRESHOLD) continue
        try {
          await sendNotification(serviceClient, {
            userId,
            type: 'new_match',
            title: `Excellente opportunité : ${match.jobTitle}`,
            message: `${match.jobTitle} chez ${match.company} correspond à ${match.overallScore}% à votre profil.`,
            relatedJobId: match.jobId,
          })
        } catch {
          // Already logged inside sendNotification; a missed notification
          // shouldn't fail the whole run — the match itself is saved either way.
        }
      }

      usersProcessed++
    } catch (error) {
      console.error(`scheduled-job-search failed for user ${userId}`, error)
      await serviceClient
        .from('agent_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          errors: [error instanceof Error ? error.message : String(error)],
        })
        .eq('id', run.id)
      usersFailed++
    }
  }

  return jsonResponse({
    users_due: dueUsers.length,
    users_processed: usersProcessed,
    users_failed: usersFailed,
  })
})
