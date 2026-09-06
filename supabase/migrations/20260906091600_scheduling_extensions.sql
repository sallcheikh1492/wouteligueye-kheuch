-- Enables Postgres-native cron scheduling (spec section 17: "Cron Jobs ou
-- système de planification compatible"). pg_cron runs the scheduled query;
-- pg_net lets that query call the scheduled-job-search Edge Function over
-- HTTP without leaving Postgres. Both are standard Supabase extensions.
--
-- The actual `cron.schedule(...)` call is NOT created here on purpose: it
-- needs this project's real URL and a secret, which don't exist yet and
-- must never be committed to the repo. Run supabase/scheduling.sql once
-- (via the SQL editor) after deploying scheduled-job-search — see the
-- "Planification" section of the README.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
