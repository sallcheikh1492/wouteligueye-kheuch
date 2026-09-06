-- Caches the structured output of analyze-job (JobAnalysis) so it is computed
-- once per job rather than once per user/match. Distinct from `raw_data`,
-- which holds the original unprocessed payload from the source.
alter table public.jobs add column ai_analysis jsonb;
