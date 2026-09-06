import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { AIProvider, JobAnalysis } from '../ai/types.ts'

type JobRow = {
  id: string
  title: string
  company: string
  description: string | null
  requirements: string | null
  ai_analysis: JobAnalysis | null
}

// analyze-job's core logic, reused by both the standalone /analyze-job
// endpoint and /calculate-job-match (which needs the job analysis to score
// against but shouldn't force the user to call two endpoints). Cached on
// jobs.ai_analysis so a given posting is only analyzed once, regardless of
// how many users end up matched against it.
export async function ensureJobAnalysis(
  serviceClient: SupabaseClient,
  provider: AIProvider,
  job: JobRow,
): Promise<JobAnalysis> {
  if (job.ai_analysis) {
    return job.ai_analysis
  }

  const analysis = await provider.analyzeJob({
    title: job.title,
    company: job.company,
    description: job.description ?? '',
    requirements: job.requirements ?? undefined,
  })

  const { error } = await serviceClient.from('jobs').update({ ai_analysis: analysis }).eq('id', job.id)
  if (error) {
    console.error('Failed to cache job analysis', error)
  }

  return analysis
}
