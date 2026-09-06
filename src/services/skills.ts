import { supabase } from '@/integrations/supabase/client'
import type { Tables, TablesInsert } from '@/types/database'

export async function fetchSkills(userId: string): Promise<Tables<'skills'>[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('user_id', userId)
    .order('category')
    .order('name')
  if (error) throw error
  return data
}

export async function addSkill(input: TablesInsert<'skills'>) {
  const { data, error } = await supabase.from('skills').insert(input).select().single()
  if (error) throw error
  return data
}

export async function deleteSkill(id: string) {
  const { error } = await supabase.from('skills').delete().eq('id', id)
  if (error) throw error
}
