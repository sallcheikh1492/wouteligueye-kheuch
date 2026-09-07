import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

// Every admin-* Edge Function calls this before doing anything sensitive.
// Deliberately re-checks admin_users via the service role rather than
// trusting a client-supplied flag — the caller only proves who they are
// (via their JWT), never that they're an admin.
export async function requireAdmin(
  serviceClient: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await serviceClient
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.error('Failed to check admin_users', error)
    return false
  }
  return !!data
}
