-- Admin status lives in its own table rather than a column on `profiles`,
-- specifically so it can never be granted via the normal profile-update path
-- (RLS policies are row-level, not column-level: a boolean column on
-- `profiles` would let any user set their own `is_admin = true` through the
-- exact same "update my own profile" policy already in place). No INSERT/
-- UPDATE/DELETE policy exists here for `authenticated` at all — only the
-- service role (used exclusively by the admin-* Edge Functions, which
-- re-verify the caller is already an admin before touching this table) can
-- ever write to it.
create table public.admin_users (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- A user may check their own admin membership (so the frontend can show or
-- hide the "Administration" nav item) but gains no visibility into who else
-- is an admin from this policy alone.
create policy "admin_users_select_own"
  on public.admin_users for select
  using (user_id = auth.uid());

-- Auto-admin the designated primary administrator on signup, in addition to
-- creating their profile (unchanged from the original trigger otherwise).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;

  if new.email = 'sallcheikh1969@gmail.com' then
    insert into public.admin_users (user_id) values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

-- Retroactively grant admin to that account if it already exists (it does,
-- on this project — this is a real, named designation, not a data seed).
insert into public.admin_users (user_id)
select id from auth.users where email = 'sallcheikh1969@gmail.com'
on conflict (user_id) do nothing;
