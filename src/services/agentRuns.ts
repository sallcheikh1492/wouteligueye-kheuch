import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/types/database'

export async function fetchRecentAgentRuns(userId: string, limit = 5): Promise<Tables<'agent_runs'>[]> {
  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}
