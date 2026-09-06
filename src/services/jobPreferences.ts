import { supabase } from '@/integrations/supabase/client'
import type { Tables, TablesInsert } from '@/types/database'

export async function fetchJobPreferences(userId: string): Promise<Tables<'job_preferences'> | null> {
  const { data, error } = await supabase
    .from('job_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertJobPreferences(input: TablesInsert<'job_preferences'>) {
  const { data, error } = await supabase
    .from('job_preferences')
    .upsert(input, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}
