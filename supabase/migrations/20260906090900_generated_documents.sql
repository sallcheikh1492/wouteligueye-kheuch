create table public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  type public.generated_document_type not null,
  content text,
  file_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index generated_documents_user_id_idx on public.generated_documents(user_id);
create index generated_documents_job_id_idx on public.generated_documents(job_id);
create index generated_documents_application_id_idx on public.generated_documents(application_id);

alter table public.generated_documents enable row level security;

create policy "generated_documents_select_own"
  on public.generated_documents for select
  using (user_id = auth.uid());

create policy "generated_documents_insert_own"
  on public.generated_documents for insert
  with check (user_id = auth.uid());

create policy "generated_documents_update_own"
  on public.generated_documents for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "generated_documents_delete_own"
  on public.generated_documents for delete
  using (user_id = auth.uid());
