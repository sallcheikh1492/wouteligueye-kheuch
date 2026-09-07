// POST /admin-list-users  (no body)
//
// Returns every user account, merging Supabase Auth data (email
// confirmation, ban status, last sign-in — only readable via the Admin API,
// which requires the service role) with the matching `profiles` row.
// Admin-only: verified server-side against `admin_users`, never trusted from
// the client.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceRoleClient, createUserClient } from '../_shared/supabaseClient.ts'
import { requireAdmin } from '../_shared/adminAuth.ts'

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401)
  }

  const userClient = createUserClient(authHeader)
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()
  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const serviceClient = createServiceRoleClient()

  if (!(await requireAdmin(serviceClient, user.id))) {
    return jsonResponse({ error: 'Accès réservé aux administrateurs' }, 403)
  }

  try {
    const { data: authUsers, error: listError } = await serviceClient.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    })
    if (listError) throw listError

    const { data: profiles, error: profilesError } = await serviceClient
      .from('profiles')
      .select('id, full_name')
    if (profilesError) throw profilesError

    const { data: admins, error: adminsError } = await serviceClient.from('admin_users').select('user_id')
    if (adminsError) throw adminsError

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))
    const adminIds = new Set((admins ?? []).map((a) => a.user_id))

    const rows: AdminUserRow[] = authUsers.users.map((u) => ({
      id: u.id,
      email: u.email ?? '',
      full_name: profileById.get(u.id)?.full_name ?? null,
      is_admin: adminIds.has(u.id),
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      email_confirmed_at: u.email_confirmed_at ?? null,
      banned_until: (u as unknown as { banned_until?: string }).banned_until ?? null,
    }))

    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return jsonResponse({ users: rows })
  } catch (error) {
    console.error('admin-list-users failed', error)
    return jsonResponse({ error: 'Erreur interne lors du chargement des utilisateurs' }, 500)
  }
})
