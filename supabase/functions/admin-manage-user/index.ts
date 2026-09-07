// POST /admin-manage-user  { action: 'toggle_admin' | 'ban' | 'unban' | 'delete', user_id }
//
// All four actions require the Auth Admin API or write to admin_users —
// both service-role-only — and are gated by requireAdmin(), re-checked
// server-side on every call. An admin can never target their own account
// through this endpoint (avoids self-lockout or an accidental self-delete).
import { z } from 'npm:zod@3.23.8'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceRoleClient, createUserClient } from '../_shared/supabaseClient.ts'
import { requireAdmin } from '../_shared/adminAuth.ts'

const inputSchema = z.object({
  action: z.enum(['toggle_admin', 'ban', 'unban', 'delete']),
  user_id: z.string().uuid(),
})

// ~100 years — GoTrue has no "permanent" ban value, only a duration string.
const PERMANENT_BAN_DURATION = '876000h'

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

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  const parsed = inputSchema.safeParse(rawBody)
  if (!parsed.success) {
    return jsonResponse({ error: 'Champs invalides', details: parsed.error.flatten() }, 400)
  }
  const { action, user_id } = parsed.data

  if (user_id === user.id) {
    return jsonResponse({ error: 'Impossible d’effectuer cette action sur votre propre compte' }, 400)
  }

  try {
    switch (action) {
      case 'toggle_admin': {
        const isAdmin = await requireAdmin(serviceClient, user_id)
        if (isAdmin) {
          const { error } = await serviceClient.from('admin_users').delete().eq('user_id', user_id)
          if (error) throw error
        } else {
          const { error } = await serviceClient.from('admin_users').insert({ user_id })
          if (error) throw error
        }
        return jsonResponse({ ok: true, is_admin: !isAdmin })
      }
      case 'ban': {
        const { error } = await serviceClient.auth.admin.updateUserById(user_id, {
          ban_duration: PERMANENT_BAN_DURATION,
        })
        if (error) throw error
        return jsonResponse({ ok: true })
      }
      case 'unban': {
        const { error } = await serviceClient.auth.admin.updateUserById(user_id, { ban_duration: 'none' })
        if (error) throw error
        return jsonResponse({ ok: true })
      }
      case 'delete': {
        // Cascades to profiles and every table referencing it (cvs, skills,
        // applications, generated_documents, agent_runs, notifications...)
        // via the `on delete cascade` foreign keys already in the schema.
        const { error } = await serviceClient.auth.admin.deleteUser(user_id)
        if (error) throw error
        return jsonResponse({ ok: true })
      }
    }
  } catch (error) {
    console.error(`admin-manage-user (${action}) failed`, error)
    return jsonResponse({ error: "Échec de l'opération" }, 500)
  }
})
