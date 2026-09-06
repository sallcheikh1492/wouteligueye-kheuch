-- Reference table of job sources the discovery agent is allowed to query.
-- Rows are managed by administrators / edge functions using the service role key;
-- regular users can only read the list (e.g. to filter jobs by source in the UI).
create table public.job_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  url text,
  type public.job_source_type not null,
  is_active boolean not null default true,
  api_available boolean not null default false,
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.job_sources enable row level security;

create policy "job_sources_select_authenticated"
  on public.job_sources for select
  to authenticated
  using (true);

-- Baseline source enabling manual job import by URL (section 11: import via URL always allowed).
insert into public.job_sources (name, type, is_active, api_available)
values ('Import manuel', 'manual', true, false)
on conflict (name) do nothing;
