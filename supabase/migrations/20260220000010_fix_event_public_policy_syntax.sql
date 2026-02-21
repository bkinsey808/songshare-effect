-- Migration: Correct RLS policy paren structure for event_public
-- Description: The previous migration had a syntax issue with unmatched parentheses
-- in the second JWT validation check. This corrects it to match the pattern from user_public.

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
    ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)
  )
);
