-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view property images (public bucket)
CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Allow admins to upload property images
CREATE POLICY "Admins can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update property images
CREATE POLICY "Admins can update property images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete property images
CREATE POLICY "Admins can delete property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND public.has_role(auth.uid(), 'admin')
);