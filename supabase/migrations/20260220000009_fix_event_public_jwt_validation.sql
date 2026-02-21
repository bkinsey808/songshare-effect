-- Migration: Add JWT validation to event_public public read policy
-- Description: The public read policy was only checking is_public=true, but Realtime
-- requires explicit JWT validation. This adds the same pattern as user_public to ensure
-- the user has a valid visitor_id or user_id in their JWT before allowing access.

DROP POLICY IF EXISTS "Allow read access to public events" ON public.event_public;

CREATE POLICY "Allow read access to public events"
ON public.event_public
FOR SELECT
TO authenticated
USING (
  is_public = true
  AND (
    (((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL)
    OR
    (((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL
  )
);
