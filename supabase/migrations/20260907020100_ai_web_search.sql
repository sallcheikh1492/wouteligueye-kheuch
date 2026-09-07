-- Opt-in per-user setting: when enabled and OPENAI_API_KEY is configured,
-- discovery also asks OpenAI to search the public web for postings matching
-- the user's desired_titles/preferred_locations/keywords, in addition to
-- their configured RSS feeds.
alter table public.job_preferences
  add column web_search_enabled boolean not null default false;

-- Shared pseudo-source jobs found via AI web search are attributed to,
-- mirroring the existing "Import manuel" row for manually-added jobs.
insert into public.job_sources (name, type, is_active, api_available)
values ('Recherche web IA (OpenAI)', 'ai_web_search', true, true)
on conflict (name) do nothing;
