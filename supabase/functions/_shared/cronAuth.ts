// Internal-only Edge Functions (triggered by pg_cron, not by the frontend)
// can't present a user JWT, so they're gated by a shared secret instead —
// set once via `supabase secrets set CRON_SECRET=...` and passed as the
// `x-cron-secret` header by the scheduled pg_net call (see
// supabase/scheduling.sql). Never accept these calls without it.
export function verifyCronSecret(req: Request): boolean {
  const expected = Deno.env.get('CRON_SECRET')
  if (!expected) return false
  const provided = req.headers.get('x-cron-secret')
  return !!provided && provided === expected
}
