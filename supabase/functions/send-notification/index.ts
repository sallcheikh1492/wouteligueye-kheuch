// POST /send-notification  { user_id, title, message, type, related_job_id? }
//
// Internal-only function (spec section 20): notifications are always
// agent/system-initiated, never something a user can send to another user's
// account, so this is gated by CRON_SECRET rather than a user JWT — it's
// meant to be called from other server-side flows (scheduled-job-search
// today; deadline/follow-up reminders in the future), not the frontend.
import { z } from 'npm:zod@3.23.8'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceRoleClient } from '../_shared/supabaseClient.ts'
import { verifyCronSecret } from '../_shared/cronAuth.ts'
import { sendNotification } from '../_shared/notifications/sendNotification.ts'

const inputSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
  type: z.enum(['new_match', 'deadline_reminder', 'follow_up_reminder', 'status_change', 'agent_summary']),
  related_job_id: z.string().uuid().optional(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }
  if (!verifyCronSecret(req)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  try {
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

    const serviceClient = createServiceRoleClient()
    await sendNotification(serviceClient, {
      userId: parsed.data.user_id,
      title: parsed.data.title,
      message: parsed.data.message,
      type: parsed.data.type,
      relatedJobId: parsed.data.related_job_id,
    })

    return jsonResponse({ ok: true })
  } catch (error) {
    console.error('send-notification failed', error)
    return jsonResponse({ error: "Erreur interne lors de l'envoi de la notification" }, 500)
  }
})
