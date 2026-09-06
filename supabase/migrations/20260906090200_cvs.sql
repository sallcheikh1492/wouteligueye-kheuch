create table public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  file_url text not null,
  file_type text not null,
  is_primary boolean not null default false,
  raw_text text,
  parsed_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cvs_user_id_idx on public.cvs(user_id);

-- Only one primary CV per user
create unique index cvs_one_primary_per_user_idx
  on public.cvs(user_id)
  where is_primary;

create trigger cvs_set_updated_at
  before update on public.cvs
  for each row execute function public.set_updated_at();

alter table public.cvs enable row level security;

create policy "cvs_select_own"
  on public.cvs for select
  using (user_id = auth.uid());

create policy "cvs_insert_own"
  on public.cvs for insert
  with check (user_id = auth.uid());

create policy "cvs_update_own"
  on public.cvs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "cvs_delete_own"
  on public.cvs for delete
  using (user_id = auth.uid());
