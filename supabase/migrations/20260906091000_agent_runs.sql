create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_type public.agent_type not null,
  status public.agent_run_status not null default 'running',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  jobs_found integer not null default 0,
  jobs_processed integer not null default 0,
  jobs_matched integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create index agent_runs_user_id_idx on public.agent_runs(user_id);
create index agent_runs_started_at_idx on public.agent_runs(started_at desc);

alter table public.agent_runs enable row level security;

-- Agent runs are written by edge functions using the service role key (which
-- bypasses RLS). Regular users can only read their own execution history.
create policy "agent_runs_select_own"
  on public.agent_runs for select
  using (user_id = auth.uid());
