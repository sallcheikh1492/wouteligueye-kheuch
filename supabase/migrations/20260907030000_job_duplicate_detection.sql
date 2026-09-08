-- Cross-source duplicate detection. Exact (source_id, external_id) dedup
-- only catches re-ingesting the same item from the SAME source; now that
-- postings can come from multiple RSS feeds and AI web search, the same
-- job can legitimately be discovered twice under two different external
-- ids. This adds a fuzzy cross-source check using the trigram indexes
-- already on jobs.title / jobs.company (see 20260906090600_jobs.sql).
alter table public.jobs
  add column duplicate_of_id uuid references public.jobs(id) on delete set null;

create or replace function public.find_duplicate_job(
  p_source_id uuid,
  p_title text,
  p_company text
) returns uuid
language sql
stable
as $$
  select id
  from public.jobs
  where status = 'active'
    and source_id <> p_source_id
    and similarity(title, p_title) > 0.45
    and similarity(company, p_company) > 0.5
  order by similarity(title, p_title) + similarity(company, p_company) desc
  limit 1;
$$;
