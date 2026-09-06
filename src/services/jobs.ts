import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/types/database'

export type JobMatchWithJob = Tables<'job_matches'> & { jobs: Tables<'jobs'> }

export type JobFilters = {
  search?: string
  location?: string
  minScore?: number
}

export async function fetchMatchedJobs(userId: string, filters: JobFilters = {}): Promise<JobMatchWithJob[]> {
  let query = supabase
    .from('job_matches')
    .select('*, jobs(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (filters.minScore) {
    query = query.gte('overall_score', filters.minScore)
  }

  const { data, error } = await query
  if (error) throw error

  let rows = (data ?? []) as unknown as JobMatchWithJob[]

  if (filters.search) {
    const term = filters.search.toLowerCase()
    rows = rows.filter(
      (row) =>
        row.jobs.title.toLowerCase().includes(term) || row.jobs.company.toLowerCase().includes(term),
    )
  }
  if (filters.location) {
    const loc = filters.location.toLowerCase()
    rows = rows.filter((row) => row.jobs.location?.toLowerCase().includes(loc))
  }

  return rows
}

export async function fetchTopMatches(userId: string, limit = 5): Promise<JobMatchWithJob[]> {
  const { data, error } = await supabase
    .from('job_matches')
    .select('*, jobs(*)')
    .eq('user_id', userId)
    .order('overall_score', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as unknown as JobMatchWithJob[]
}

export async function fetchRecentMatches(userId: string, limit = 5): Promise<JobMatchWithJob[]> {
  const { data, error } = await supabase
    .from('job_matches')
    .select('*, jobs(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as unknown as JobMatchWithJob[]
}

export async function fetchJobMatch(userId: string, jobId: string): Promise<JobMatchWithJob | null> {
  const { data, error } = await supabase
    .from('job_matches')
    .select('*, jobs(*)')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .maybeSingle()
  if (error) throw error
  return data as unknown as JobMatchWithJob | null
}

export async function deleteJobMatch(id: string) {
  const { error } = await supabase.from('job_matches').delete().eq('id', id)
  if (error) throw error
}

export async function fetchJob(jobId: string): Promise<Tables<'jobs'> | null> {
  const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).maybeSingle()
  if (error) throw error
  return data
}

export type ManualJobInput = {
  title: string
  company: string
  location?: string
  application_url?: string
  description?: string
}

export async function processJob(input: ManualJobInput): Promise<Tables<'jobs'>> {
  const { data, error } = await supabase.functions.invoke<{ job: Tables<'jobs'>; error?: string }>(
    'process-job',
    { body: input },
  )
  if (error) throw error
  if (!data || data.error) throw new Error(data?.error ?? "Échec de l'import de l'offre")
  return data.job
}

export async function calculateJobMatch(jobId: string) {
  const { data, error } = await supabase.functions.invoke<{ match?: unknown; error?: string }>(
    'calculate-job-match',
    { body: { job_id: jobId } },
  )
  if (error) throw error
  if (!data || data.error) throw new Error(data?.error ?? 'Échec du calcul du score')
  return data.match
}
