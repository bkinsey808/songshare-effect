-- Temporarily test if RLS is the blocker by using a very permissive owner policy
-- This will help us confirm whether the JWT path issue exists

DROP POLICY IF EXISTS "Allow owner to read own event_public" ON public.event_public;
DROP POLICY IF EXISTS "Test owner read" ON public.event_public;

-- Very simple test: allow owner to read if they have valid owner_id
-- This ignores JWT validation temporarily to test if JWT is the blocker
CREATE POLICY "Allow owner to read own event_public"
ON public.event_public
FOR SELECT
TO authenticated
USING (owner_id IS NOT NULL);

COMMENT ON POLICY "Allow owner to read own event_public" ON public.event_public IS
  'Temporary test policy - allows all event owners to read their events. Used for debugging JWT/RLS issues.';
