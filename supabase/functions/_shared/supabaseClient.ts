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
