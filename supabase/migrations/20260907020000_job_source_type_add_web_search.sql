-- Separate migration: Postgres won't let a new enum value be used in the
-- same transaction that adds it, so this must land before the migration
-- that seeds a job_sources row with it.
alter type public.job_source_type add value 'ai_web_search';
