-- One-time manual setup for scheduled job search (spec sections 10 & 17).
-- Run this in the Supabase SQL editor AFTER deploying the
-- scheduled-job-search Edge Function and setting the CRON_SECRET secret:
--
--   npx supabase functions deploy scheduled-job-search
--   npx supabase secrets set CRON_SECRET=$(openssl rand -hex 32)
--
-- This is a script, not a migration: it needs your project's real URL and
-- the CRON_SECRET value, neither of which exist before you deploy, and
-- neither of which should ever be committed to the repository. Store the
-- secret in Supabase Vault rather than pasting it into the cron job text,
-- so it never appears in plain text in `cron.job` or its run history.

-- 1. Store the secret in Vault (replace with the value you set above).
select vault.create_secret('REPLACE_WITH_YOUR_CRON_SECRET', 'cron_secret');

-- 2. Schedule the poll. It runs every 30 minutes; scheduled-job-search
--    itself decides which users are actually due, based on their
--    job_preferences.search_frequency and their last successful run — so a
--    30-minute poll interval is fine even for a "weekly" preference.
select cron.schedule(
  'scheduled-job-search',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://REPLACE_WITH_YOUR_PROJECT_REF.supabase.co/functions/v1/scheduled-job-search',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To inspect scheduled runs:
--   select * from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 20;
-- To remove the schedule:
--   select cron.unschedule('scheduled-job-search');
