-- Create exercise-videos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-videos',
  'exercise-videos',
  true,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload exercise videos
CREATE POLICY "Users can upload exercise videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exercise-videos' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow users to update their own videos (based on path auth.uid())
CREATE POLICY "Users can update own exercise videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'exercise-videos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'exercise-videos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own videos
CREATE POLICY "Users can delete own exercise videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'exercise-videos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to exercise videos
CREATE POLICY "Public can view exercise videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-videos');
