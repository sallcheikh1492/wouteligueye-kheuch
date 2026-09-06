import { supabase } from '@/integrations/supabase/client'
import type { Tables, TablesUpdate } from '@/types/database'

export async function fetchProfile(userId: string): Promise<Tables<'profiles'> | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function seedDemoProfile() {
  const { error } = await supabase.rpc('seed_demo_profile')
  if (error) throw error
}

export async function updateProfile(userId: string, patch: TablesUpdate<'profiles'>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}
