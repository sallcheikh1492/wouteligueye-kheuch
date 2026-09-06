import { supabase } from '@/integrations/supabase/client'
import type { Tables, TablesInsert } from '@/types/database'

export async function fetchJobSources(): Promise<Tables<'job_sources'>[]> {
  const { data, error } = await supabase.from('job_sources').select('*').order('created_at')
  if (error) throw error
  return data
}

export async function addJobSource(input: Omit<TablesInsert<'job_sources'>, 'type'>) {
  const { data, error } = await supabase
    .from('job_sources')
    .insert({ ...input, type: 'rss_feed' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function discoverJobs() {
  const { data, error } = await supabase.functions.invoke<{
    jobs_found: number
    jobs_processed: number
    jobs_matched: number
    error?: string
  }>('discover-jobs', { body: {} })
  if (error) throw error
  if (!data || data.error) throw new Error(data?.error ?? 'Échec de la recherche automatique')
  return data
}
