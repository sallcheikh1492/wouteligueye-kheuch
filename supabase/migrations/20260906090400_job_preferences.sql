create table public.job_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  desired_titles jsonb not null default '[]'::jsonb,
  preferred_locations jsonb not null default '[]'::jsonb,
  employment_types public.employment_type[] not null default '{}',
  remote_preference public.remote_preference not null default 'any',
  minimum_salary numeric(12, 2),
  keywords jsonb not null default '[]'::jsonb,
  excluded_keywords jsonb not null default '[]'::jsonb,
  search_frequency public.search_frequency not null default 'daily',
  auto_apply_enabled boolean not null default false,
  minimum_match_score smallint not null default 60 check (minimum_match_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger job_preferences_set_updated_at
  before update on public.job_preferences
  for each row execute function public.set_updated_at();

alter table public.job_preferences enable row level security;

create policy "job_preferences_select_own"
  on public.job_preferences for select
  using (user_id = auth.uid());

create policy "job_preferences_insert_own"
  on public.job_preferences for insert
  with check (user_id = auth.uid());

create policy "job_preferences_update_own"
  on public.job_preferences for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "job_preferences_delete_own"
  on public.job_preferences for delete
  using (user_id = auth.uid());
