-- Extensions
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- fuzzy search on jobs.title / jobs.company

-- Enumerated types shared across tables
create type public.skill_category as enum (
  'programming',
  'database',
  'business_intelligence',
  'data_analysis',
  'machine_learning',
  'big_data',
  'cloud',
  'soft_skills'
);

create type public.skill_level as enum (
  'beginner',
  'intermediate',
  'advanced',
  'expert'
);

create type public.employment_type as enum (
  'full_time',
  'part_time',
  'contract',
  'internship',
  'freelance'
);

create type public.remote_preference as enum (
  'onsite',
  'hybrid',
  'remote',
  'any'
);

create type public.search_frequency as enum (
  'every_6_hours',
  'every_12_hours',
  'daily',
  'weekly'
);

create type public.job_source_type as enum (
  'official_api',
  'rss_feed',
  'company_career_page',
  'manual'
);

create type public.job_status as enum (
  'active',
  'expired',
  'closed',
  'duplicate'
);

create type public.application_status as enum (
  'discovered',
  'reviewing',
  'interested',
  'documents_ready',
  'ready_to_apply',
  'submitted',
  'interview',
  'rejected',
  'accepted',
  'withdrawn',
  'no_response'
);

create type public.generated_document_type as enum (
  'optimized_cv',
  'cover_letter',
  'application_answers'
);

create type public.agent_type as enum (
  'cv_analysis',
  'job_discovery',
  'job_matching',
  'cover_letter_generation',
  'cv_optimization',
  'scheduled_job_search'
);

create type public.agent_run_status as enum (
  'running',
  'completed',
  'failed',
  'partial'
);

create type public.notification_type as enum (
  'new_match',
  'deadline_reminder',
  'follow_up_reminder',
  'status_change',
  'agent_summary'
);

-- Shared trigger to keep `updated_at` current on any UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
