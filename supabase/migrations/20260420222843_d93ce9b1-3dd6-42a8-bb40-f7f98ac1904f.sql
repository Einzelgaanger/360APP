-- Schedule the IDP check-in to run hourly
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'idp-check-in-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://sgttsotrvemmgmujcuay.supabase.co/functions/v1/idp-check-in',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuaXFxYnVydWxyZHdjYmpldHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NDUxNDQsImV4cCI6MjA4NDAyMTE0NH0.SBBXe4GxDn4hUJNe6gsGJyPSpo7t30xWYKonkAApbVw"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);