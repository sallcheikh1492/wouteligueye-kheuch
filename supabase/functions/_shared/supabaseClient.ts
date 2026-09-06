import { createClient } from 'npm:@supabase/supabase-js@2'

// Client scoped to the calling user's JWT. RLS applies exactly as it would
// for the frontend, so this client can only ever read/write rows the caller
// owns — no separate ownership checks are needed for user-scoped tables.
export function createUserClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
}

// Bypasses RLS — only for writes to shared, non-user-owned tables (jobs,
// job_matches, job_sources) that regular users are not allowed to write to
// directly. Never use this to read or write another user's own data; always
// verify the caller's identity with a user-scoped client first.
export function createServiceRoleClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}
