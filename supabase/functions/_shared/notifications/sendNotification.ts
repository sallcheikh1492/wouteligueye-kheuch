import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

export type NotificationType =
  | 'new_match'
  | 'deadline_reminder'
  | 'follow_up_reminder'
  | 'status_change'
  | 'agent_summary'

export type NotificationInput = {
  userId: string
  title: string
  message: string
  type: NotificationType
  relatedJobId?: string | null
}

// notifications has no INSERT policy for regular users (spec: delivery is
// always agent/system-initiated) — this always goes through the service role.
export async function sendNotification(serviceClient: SupabaseClient, input: NotificationInput) {
  const { error } = await serviceClient.from('notifications').insert({
    user_id: input.userId,
    title: input.title,
    message: input.message,
    type: input.type,
    related_job_id: input.relatedJobId ?? null,
  })
  if (error) {
    console.error('Failed to insert notification', error)
    throw error
  }
}
