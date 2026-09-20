-- Schedules the news refresh: calls POST /api/news/refresh every 3
-- hours so /noticias stays current without exceeding NewsData.io's free
-- tier (see the spec — 10 countries x 8 refreshes/day = 80 requests/day,
-- well under the ~200/day free limit).
--
-- How to run this:
--   1. In the Supabase SQL Editor, first enable the two extensions this
--      needs (one-time, safe to re-run):
--        create extension if not exists pg_cron with schema extensions;
--        create extension if not exists pg_net with schema extensions;
--   2. Replace the two placeholders below:
--        <YOUR_SITE_URL>    e.g. https://globeing.co (or your Vercel
--                           preview URL while testing)
--        <YOUR_CRON_SECRET> must match the CRON_SECRET env var set in
--                           Vercel (and in web/.env.local for local
--                           testing) — this is what stops a random
--                           visitor from hitting /api/news/refresh and
--                           burning through the NewsData.io quota.
--   3. Run this once. Supabase's pg_cron then calls the endpoint on
--      its own from then on — no server of yours needs to stay running.
select cron.schedule(
  'news-refresh-every-3h',
  '0 */3 * * *',
  $$
  select net.http_post(
    url := '<YOUR_SITE_URL>/api/news/refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<YOUR_CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To check it's registered: select * from cron.job;
-- To see run history:       select * from cron.job_run_details order by start_time desc limit 20;
-- To remove it later:       select cron.unschedule('news-refresh-every-3h');
