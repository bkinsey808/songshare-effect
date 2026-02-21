-- Fix the owner read policy to use the correct JWT path
-- The sessionData JWT has structure: { user: { user_id: ... }, ... }
-- NOT: { app_metadata: { user: { user_id: ... } } }

DROP POLICY IF EXISTS "Allow owner to read own event_public" ON public.event_public;

CREATE POLICY "Allow owner to read own event_public"
ON public.event_public
FOR SELECT
TO authenticated
USING (
	owner_id = ((auth.jwt() ->> 'user')::jsonb ->> 'user_id')::uuid
);

COMMENT ON POLICY "Allow owner to read own event_public" ON public.event_public IS
	'Owners can directly read their own event_public records without needing to be in event_user, enabling realtime subscriptions to work immediately after event creation. Uses correct JWT path from sessionData.';
