
-- Add invoice_generated_at to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS invoice_generated_at timestamp with time zone;

-- Bookings updated_at trigger
DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable pg_cron + pg_net (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily promo at 5:00 UTC (08:00 EAT)
SELECT cron.unschedule('daily-promotional-email') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='daily-promotional-email');

SELECT cron.schedule(
  'daily-promotional-email',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url:='https://xfrpauvnxgrpbhcuwtgw.supabase.co/functions/v1/daily-promo-email',
    headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcnBhdXZueGdycGJoY3V3dGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjU1OTAsImV4cCI6MjA5MjcwMTU5MH0.GQCDpyFU0mkMygFq3mt9UXWBj-Dv6OVu7o_7msV-PMA"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
