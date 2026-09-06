import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { AIProvider, CVAnalysis, MatchResult } from '../ai/types.ts'
import { ensureJobAnalysis } from './ensureJobAnalysis.ts'

type JobRow = {
  id: string
  title: string
  company: string
  description: string | null
  requirements: string | null
  location: string | null
  ai_analysis: unknown
}

// Shared by calculate-job-match (explicit user request) and discover-jobs
// (auto-match a newly found posting). Returns null, rather than throwing,
// when the user has no analyzed primary CV yet — callers decide whether
// that's a hard error (calculate-job-match) or something to skip quietly
// (discover-jobs, mid-batch).
export async function computeAndSaveMatch(params: {
  userClient: SupabaseClient
  serviceClient: SupabaseClient
  provider: AIProvider
  userId: string
  job: JobRow
}): Promise<MatchResult | null> {
  const { userClient, serviceClient, provider, userId, job } = params

  const { data: cv } = await userClient
    .from('cvs')
    .select('parsed_data, raw_text')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .maybeSingle()
  if (!cv || !cv.parsed_data) return null

  const { data: skillRows } = await userClient.from('skills').select('name').eq('user_id', userId)
  const { data: prefs } = await userClient
    .from('job_preferences')
    .select('preferred_locations, remote_preference')
    .eq('user_id', userId)
    .maybeSingle()

  const jobAnalysis = await ensureJobAnalysis(serviceClient, provider, job)

  const matchResult = await provider.calculateMatch({
    cvAnalysis: cv.parsed_data as unknown as CVAnalysis,
    cvRawText: cv.raw_text ?? '',
    userSkills: (skillRows ?? []).map((s) => s.name),
    jobAnalysis,
    jobDescription: job.description ?? '',
    jobLocation: job.location,
    preferredLocations: Array.isArray(prefs?.preferred_locations)
      ? (prefs!.preferred_locations as string[])
      : [],
    remotePreference: prefs?.remote_preference ?? 'any',
  })

  // job_matches has no INSERT/UPDATE policy for regular users (matches are
  // always computed server-side) — the write goes through the service role.
  const { error: upsertError } = await serviceClient.from('job_matches').upsert(
    {
      job_id: job.id,
      user_id: userId,
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
    throw upsertError
  }

  return matchResult
}
