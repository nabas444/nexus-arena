DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;

-- Restrict listing/select via API to only your own folder.
-- Direct public URLs (CDN) still work because the bucket is public.
CREATE POLICY "Users can list their own avatar files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );