-- Add new booking fields for check-in details and pricing
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS check_in_date date,
ADD COLUMN IF NOT EXISTS check_in_time text,
ADD COLUMN IF NOT EXISTS nights integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_amount numeric;