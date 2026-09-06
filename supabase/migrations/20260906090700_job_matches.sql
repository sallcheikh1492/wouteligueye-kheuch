create table public.job_matches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  overall_score smallint not null check (overall_score between 0 and 100),
  skills_score smallint check (skills_score between 0 and 100),
  experience_score smallint check (experience_score between 0 and 100),
  education_score smallint check (education_score between 0 and 100),
  location_score smallint check (location_score between 0 and 100),
  keywords_score smallint check (keywords_score between 0 and 100),
  ai_analysis jsonb,
  missing_skills jsonb not null default '[]'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  recommendation text,
  created_at timestamptz not null default now(),
  unique (job_id, user_id)
);

create index job_matches_user_id_idx on public.job_matches(user_id);
create index job_matches_job_id_idx on public.job_matches(job_id);
create index job_matches_overall_score_idx on public.job_matches(overall_score desc);

alter table public.job_matches enable row level security;

create policy "job_matches_select_own"
  on public.job_matches for select
  using (user_id = auth.uid());

-- Matches are computed server-side (calculate-job-match edge function, service role).
-- Users may only remove a match they want to dismiss from their view.
create policy "job_matches_delete_own"
  on public.job_matches for delete
  using (user_id = auth.uid());
