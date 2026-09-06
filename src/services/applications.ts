import { supabase } from '@/integrations/supabase/client'
import type { ApplicationStatus, Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type ApplicationWithJob = Tables<'applications'> & { jobs: Tables<'jobs'> }

export const SENT_STATUSES: ApplicationStatus[] = [
  'submitted',
  'interview',
  'accepted',
  'rejected',
  'no_response',
]

export const RESPONDED_STATUSES: ApplicationStatus[] = ['interview', 'accepted', 'rejected']

export async function fetchApplications(userId: string): Promise<ApplicationWithJob[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*, jobs(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as ApplicationWithJob[]
}

export async function fetchRecentApplications(userId: string, limit = 5): Promise<ApplicationWithJob[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*, jobs(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as unknown as ApplicationWithJob[]
}

export async function createApplication(input: TablesInsert<'applications'>) {
  const { data, error } = await supabase.from('applications').insert(input).select().single()
  if (error) throw error
  return data
}

// Creates the application for this job if none exists yet, otherwise moves the
// existing one to `status` (used by the "favoris" / "préparer la candidature"
// quick actions on the Jobs page).
export async function upsertApplicationStatus(input: TablesInsert<'applications'>) {
  const { data, error } = await supabase
    .from('applications')
    .upsert(input, { onConflict: 'user_id,job_id', ignoreDuplicates: false })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateApplication(id: string, patch: TablesUpdate<'applications'>) {
  const { data, error } = await supabase
    .from('applications')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
