-- Growth Hub V2 evaluation schedule.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'growth-hub-v2-evaluate-daily';

SELECT cron.schedule(
  'growth-hub-v2-evaluate-daily',
  '15 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sgttsotrvemmgmujcuay.supabase.co/functions/v1/recommendation-evaluate',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object('metricDate', (now()::date - 1)::text)
  );
  $$
);

