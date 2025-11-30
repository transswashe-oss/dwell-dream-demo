-- Add google_maps_url field to apartments table
ALTER TABLE public.apartments 
ADD COLUMN google_maps_url TEXT;

-- Make bathrooms and square_feet nullable
ALTER TABLE public.apartments 
ALTER COLUMN bathrooms DROP NOT NULL,
ALTER COLUMN square_feet DROP NOT NULL;

-- Create storage bucket for apartment images
INSERT INTO storage.buckets (id, name, public)
VALUES ('apartment-images', 'apartment-images', true);

-- Storage policies for apartment images
CREATE POLICY "Apartment images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'apartment-images');

CREATE POLICY "Admins can upload apartment images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'apartment-images' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can update apartment images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'apartment-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can delete apartment images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'apartment-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);