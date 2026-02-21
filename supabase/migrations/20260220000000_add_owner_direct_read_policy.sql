-- Add explicit RLS policy allowing event owners to directly read their own events
-- This is critical for realtime subscriptions - owners must always be able to read their events
-- even if their event_user row hasn't been created or status is not finalized.

CREATE POLICY "Allow owner to read own event_public"
ON public.event_public
FOR SELECT
TO authenticated
USING (
	owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
);

COMMENT ON POLICY "Allow owner to read own event_public" ON public.event_public IS
	'Owners can directly read their own event_public records without needing to be in event_user, enabling realtime subscriptions to work immediately after event creation.';
