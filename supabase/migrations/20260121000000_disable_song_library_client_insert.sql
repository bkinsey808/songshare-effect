-- Disable client-side INSERT operations on song_library
-- All inserts must now go through the /api/song-library/add server endpoint
--
-- This migration removes the INSERT RLS policy and replaces it with a policy
-- that denies all inserts, ensuring that:
-- 1. Clients cannot bypass the server endpoint
-- 2. Server-side validation and authorization is enforced
-- 3. Security is maintained at the database level

-- Drop the existing INSERT policy that allowed users to insert directly
DROP POLICY IF EXISTS "Users can insert into their own library" ON public.song_library;

-- Create a new policy that denies all INSERT operations from authenticated users
-- This forces all inserts through the /api/song-library/add endpoint
CREATE POLICY "Deny all INSERT operations on song_library" ON public.song_library
    FOR INSERT TO authenticated
    WITH CHECK (false);

COMMENT ON POLICY "Deny all INSERT operations on song_library" ON public.song_library IS 'All inserts must go through the /api/song-library/add server endpoint for proper validation and authorization.';
