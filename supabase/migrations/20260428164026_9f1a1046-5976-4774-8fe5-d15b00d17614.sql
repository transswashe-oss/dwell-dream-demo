
-- Add monthly pricing and unit numbers to apartments
ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS monthly_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_number text;

-- Add booking type & rental fields to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_type text NOT NULL DEFAULT 'per_night',
  ADD COLUMN IF NOT EXISTS months integer,
  ADD COLUMN IF NOT EXISTS assigned_unit_number text;

-- Constraint: booking_type must be one of allowed values
DO $$ BEGIN
  ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_booking_type_check
    CHECK (booking_type IN ('per_night','monthly'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Auto-assign a unit number on approval if missing (uses apartment.unit_number or generates one)
CREATE OR REPLACE FUNCTION public.assign_unit_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  apt_unit text;
BEGIN
  IF NEW.status = 'Approved' AND (NEW.assigned_unit_number IS NULL OR NEW.assigned_unit_number = '') THEN
    SELECT unit_number INTO apt_unit FROM public.apartments WHERE id = NEW.apartment_id;
    IF apt_unit IS NOT NULL AND apt_unit <> '' THEN
      NEW.assigned_unit_number := apt_unit;
    ELSE
      NEW.assigned_unit_number := 'NS-' || upper(substr(replace(NEW.id::text,'-',''),1,6));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_unit_number ON public.bookings;
CREATE TRIGGER trg_assign_unit_number
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.assign_unit_number();
