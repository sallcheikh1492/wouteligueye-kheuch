-- Section 11 of the spec: "le système doit permettre d'ajouter facilement de
-- nouvelles sources". Sources are shared config, not sensitive, so any
-- authenticated user may add one — except the seeded 'manual' source used
-- for direct URL/field import, which stays unique and system-managed.
create policy "job_sources_insert_authenticated"
  on public.job_sources for insert
  to authenticated
  with check (type <> 'manual');
