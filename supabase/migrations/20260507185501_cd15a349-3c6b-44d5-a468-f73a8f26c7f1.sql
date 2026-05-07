-- Apartment videos / shorts feature
CREATE TABLE IF NOT EXISTS public.apartment_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id UUID REFERENCES public.apartments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.apartment_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Videos are public" ON public.apartment_videos FOR SELECT USING (true);
CREATE POLICY "Admins insert videos" ON public.apartment_videos FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update videos" ON public.apartment_videos FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete videos" ON public.apartment_videos FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_apartment_videos_updated_at
  BEFORE UPDATE ON public.apartment_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('apartment-videos', 'apartment-videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read apartment videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'apartment-videos');
CREATE POLICY "Admins upload apartment videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'apartment-videos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update apartment videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'apartment-videos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete apartment videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'apartment-videos' AND has_role(auth.uid(), 'admin'::app_role));

-- Seed 2 sample videos (using public sample mp4 URLs)
INSERT INTO public.apartment_videos (title, description, video_url, thumbnail_url, featured)
VALUES
  ('Nyali Beachfront Tour', 'A quick walkthrough of our beachfront apartment with ocean views.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg', true),
  ('Coastal Living Highlights', 'See the lifestyle and amenities at our Mombasa coastal homes.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg', true);