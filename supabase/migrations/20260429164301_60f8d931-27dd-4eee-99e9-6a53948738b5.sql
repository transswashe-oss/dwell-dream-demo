-- Cancellation requests
CREATE TABLE public.cancellation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cancellation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create own cancellation" ON public.cancellation_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own cancellation" ON public.cancellation_requests
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins update cancellations" ON public.cancellation_requests
  FOR UPDATE USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins delete cancellations" ON public.cancellation_requests
  FOR DELETE USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_cancel_updated_at BEFORE UPDATE ON public.cancellation_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mark booking on cancellation request
CREATE OR REPLACE FUNCTION public.mark_booking_cancellation_requested()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.bookings SET status = 'CancellationRequested', updated_at = now()
  WHERE id = NEW.booking_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_mark_booking_cancel AFTER INSERT ON public.cancellation_requests
  FOR EACH ROW EXECUTE FUNCTION public.mark_booking_cancellation_requested();

-- Discounts
CREATE TABLE public.discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- percentage or fixed
  amount NUMERIC NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active discounts" ON public.discounts
  FOR SELECT USING (active = true OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins manage discounts ins" ON public.discounts
  FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins manage discounts upd" ON public.discounts
  FOR UPDATE USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins manage discounts del" ON public.discounts
  FOR DELETE USING (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_discounts_updated_at BEFORE UPDATE ON public.discounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Site settings (single row)
CREATE TABLE public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  contact_email TEXT NOT NULL DEFAULT 'omaryw003@gmail.com',
  contact_phone TEXT NOT NULL DEFAULT '+254 725 409 996',
  contact_address TEXT NOT NULL DEFAULT 'Nyali, Mombasa, Kenya',
  footer_text TEXT NOT NULL DEFAULT 'Your trusted coastal partner in Mombasa — short stays and long-term rentals along Nyali shore.',
  facebook_url TEXT DEFAULT '',
  twitter_url TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  linkedin_url TEXT DEFAULT '',
  whatsapp_number TEXT DEFAULT '+254725409996',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins update settings" ON public.site_settings FOR UPDATE USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins insert settings" ON public.site_settings FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role));
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Apartment occupancy / availability
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS max_occupancy INTEGER NOT NULL DEFAULT 4;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS available BOOLEAN NOT NULL DEFAULT true;