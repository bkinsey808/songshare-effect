-- Create a public Supabase Storage bucket for user-uploaded images.
--
-- The bucket is marked public so files are accessible via the CDN URL:
--   {SUPABASE_URL}/storage/v1/object/public/images/{path}
--
-- Uploads and deletes are performed server-side using the service key
-- (which bypasses RLS), so no INSERT/DELETE policies are needed here.
-- The SELECT policy allows public read for all objects in this bucket.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
	'images',
	'images',
	true,
	10485760,
	ARRAY[
		'image/jpeg',
		'image/png',
		'image/gif',
		'image/webp',
		'image/avif',
		'image/svg+xml'
	]
)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous and authenticated users to read objects in the images bucket.
-- Service-key uploads bypass RLS entirely so no INSERT policy is required.
CREATE POLICY "Public read access for images bucket"
	ON storage.objects
	FOR SELECT
	USING (bucket_id = 'images');
