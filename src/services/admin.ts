import { supabase } from '@/integrations/supabase/client'

export async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return !!data
}

export type AdminUserRow = {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  banned_until: string | null
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase.functions.invoke<{ users: AdminUserRow[]; error?: string }>(
    'admin-list-users',
    { body: {} },
  )
  if (error) throw error
  if (!data || data.error) throw new Error(data?.error ?? 'Échec du chargement des utilisateurs')
  return data.users
}

export type AdminAction = 'toggle_admin' | 'ban' | 'unban' | 'delete'

export async function manageUser(action: AdminAction, userId: string) {
  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
    'admin-manage-user',
    { body: { action, user_id: userId } },
  )
  if (error) throw error
  if (!data || data.error) throw new Error(data?.error ?? "Échec de l'opération")
  return data
}
