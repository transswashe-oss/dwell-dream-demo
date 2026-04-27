-- 1. Testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0 AND length(name) < 100),
  location TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  message TEXT NOT NULL CHECK (length(trim(message)) > 0 AND length(message) < 1000),
  avatar_initial TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved testimonials
CREATE POLICY "Approved testimonials are public"
ON public.testimonials FOR SELECT
USING (approved = true OR has_role(auth.uid(), 'admin'::app_role));

-- Anyone can submit a new (unapproved) testimonial
CREATE POLICY "Anyone can submit testimonial"
ON public.testimonials FOR INSERT
WITH CHECK (approved = false);

-- Admins can update / delete
CREATE POLICY "Admins manage testimonials update"
ON public.testimonials FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage testimonials delete"
ON public.testimonials FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Apartments: add optional square_feet column referenced in the UI
ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS square_feet INTEGER;

-- 3. Seed 10 approved testimonials (Kenyan, non-celebrity)
INSERT INTO public.testimonials (name, location, rating, message, avatar_initial, approved) VALUES
('Wanjiru Kamau', 'Nairobi', 5, 'Our stay at Nyali Shore was nothing short of magical. The apartment was spotless, the sea breeze through the balcony was unreal, and the host responded instantly. Will book again on every long weekend!', 'W', true),
('Brian Otieno', 'Kisumu', 5, 'Booking was so easy and the M-Pesa Till process worked smoothly. The apartment in Bamburi exceeded the photos. Pool, parking, secure compound — totally worth it.', 'B', true),
('Mercy Achieng', 'Mombasa', 4, 'Beautiful place close to the beach. Check-in was quick and the team gave us solid restaurant recommendations. Only wish the WiFi was a bit faster.', 'M', true),
('Dennis Mwangi', 'Thika', 5, 'I travel for work often and this is now my go-to in Mombasa. Modern, clean, and the location in Nyali is perfect.', 'D', true),
('Faith Njeri', 'Nakuru', 5, 'My family of five had the best holiday ever. The apartment was spacious, the kitchen well-equipped, and the kids loved the proximity to the ocean.', 'F', true),
('Kevin Kiprono', 'Eldoret', 5, 'Top-notch service. The host even arranged airport pickup. Felt safe, comfortable and at home throughout our 4-night stay.', 'K', true),
('Aisha Mohamed', 'Malindi', 5, 'Authentic coastal vibe with all modern comforts. The balcony view at sunrise is unbeatable. Highly recommended for honeymooners.', 'A', true),
('Samuel Wekesa', 'Bungoma', 4, 'Honest pricing, no hidden charges. The verified listing details matched exactly what we saw on arrival. Solid experience.', 'S', true),
('Joyce Kerubo', 'Kisii', 5, 'Loved the attention to detail — fresh towels, complimentary water, and even Swahili coffee. The Nyali Shore team really cares.', 'J', true),
('Peter Mutiso', 'Machakos', 5, 'My wife and I came for a quick getaway and ended up extending by two nights. The booking team handled everything seamlessly.', 'P', true);