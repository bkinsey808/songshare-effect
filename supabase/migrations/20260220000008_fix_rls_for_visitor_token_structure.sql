-- Fix RLS policies for event_public to use CORRECT app_metadata JWT paths
-- The custom visitor token has structure: { app_metadata: { visitor_id: "...", user: { user_id: "..." } } }

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read event_public" ON public.event_public;
DROP POLICY IF EXISTS "Allow owner to read own event_public" ON public.event_public;
DROP POLICY IF EXISTS "Allow read access to private events for participants" ON public.event_public;
DROP POLICY IF EXISTS "Allow read access to public events for anyone" ON public.event_public;
DROP POLICY IF EXISTS "Allow read access to public events for anonymous" ON public.event_public;
DROP POLICY IF EXISTS "Allow read event_public for library events" ON public.event_public;
DROP POLICY IF EXISTS "Allow owner to update all fields" ON public.event_public;
DROP POLICY IF EXISTS "Allow admins to update event fields" ON public.event_public;

-- Owner read policy - check if owner_id matches authenticated user
CREATE POLICY "Allow owner to read own event_public"
ON public.event_public
FOR SELECT
TO authenticated
USING (
  owner_id = (((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text)::uuid
);

-- Read policy for public events accessible to all (visitors and users)
CREATE POLICY "Allow read access to public events"
ON public.event_public
FOR SELECT
TO authenticated
USING (is_public = true);

-- Read policy for private events accessible to participants
CREATE POLICY "Allow read access to private events for participants"
ON public.event_public
FOR SELECT
TO authenticated
USING (
  (is_public = false) AND EXISTS (
    SELECT 1
    FROM public.event_user
    WHERE
      event_user.event_id = event_public.event_id AND
      event_user.user_id = (((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text)::uuid AND
      event_user.status IN ('invited', 'joined', 'left')
  )
);

-- Update policy for owner
CREATE POLICY "Allow owner to update event fields"
ON public.event_public
FOR UPDATE
TO authenticated
USING (
  owner_id = (((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text)::uuid
)
WITH CHECK (
  owner_id = (((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text)::uuid
);

-- Update policy for admins
CREATE POLICY "Allow admins to update event fields"
ON public.event_public
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.event_user
    WHERE
      event_user.event_id = event_public.event_id AND
      event_user.user_id = (((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text)::uuid AND
      event_user.role IN ('admin', 'playlist-admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.event_user
    WHERE
      event_user.event_id = event_public.event_id AND
      event_user.user_id = (((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text)::uuid AND
      event_user.role IN ('admin', 'playlist-admin')
  )
);
