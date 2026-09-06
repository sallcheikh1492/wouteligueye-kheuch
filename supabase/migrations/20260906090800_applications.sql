create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  cv_id uuid references public.cvs(id) on delete set null,
  status public.application_status not null default 'discovered',
  application_date timestamptz,
  application_url text,
  cover_letter text,
  custom_answers jsonb not null default '{}'::jsonb,
  notes text,
  follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create index applications_user_id_idx on public.applications(user_id);
create index applications_job_id_idx on public.applications(job_id);
create index applications_status_idx on public.applications(status);
create index applications_follow_up_date_idx on public.applications(follow_up_date);

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

alter table public.applications enable row level security;

create policy "applications_select_own"
  on public.applications for select
  using (user_id = auth.uid());

create policy "applications_insert_own"
  on public.applications for insert
  with check (user_id = auth.uid());

create policy "applications_update_own"
  on public.applications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "applications_delete_own"
  on public.applications for delete
  using (user_id = auth.uid());
