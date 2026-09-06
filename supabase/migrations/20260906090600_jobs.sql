-- Jobs are shared, non-user-owned data collected from authorized sources.
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source_id uuid not null references public.job_sources(id) on delete restrict,
  title text not null,
  company text not null,
  location text,
  description text,
  requirements text,
  employment_type public.employment_type,
  salary_min numeric(12, 2),
  salary_max numeric(12, 2),
  currency text,
  application_url text,
  published_at timestamptz,
  expires_at timestamptz,
  raw_data jsonb,
  status public.job_status not null default 'active',
  created_at timestamptz not null default now()
);

-- Prevent re-ingesting the same posting twice from the same source.
create unique index jobs_source_external_id_unique_idx
  on public.jobs(source_id, external_id)
  where external_id is not null;

create index jobs_title_trgm_idx on public.jobs using gin (title gin_trgm_ops);
create index jobs_company_trgm_idx on public.jobs using gin (company gin_trgm_ops);
create index jobs_location_idx on public.jobs(location);
create index jobs_published_at_idx on public.jobs(published_at desc);
create index jobs_expires_at_idx on public.jobs(expires_at);

alter table public.jobs enable row level security;

-- Jobs are visible to any authenticated user; only edge functions (service role,
-- which bypasses RLS) may insert/update/delete postings.
create policy "jobs_select_authenticated"
  on public.jobs for select
  to authenticated
  using (true);
