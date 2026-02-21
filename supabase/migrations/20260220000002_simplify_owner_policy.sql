-- Simplify and fix the owner read policy with standard JSON access
-- Use -> for JSONB object access and ->> for text extraction

DROP POLICY IF EXISTS "Allow owner to read own event_public" ON public.event_public;

CREATE POLICY "Allow owner to read own event_public"
ON public.event_public
FOR SELECT
TO authenticated
USING (
	owner_id = ((auth.jwt() -> 'user' ->> 'user_id')::uuid)
);

COMMENT ON POLICY "Allow owner to read own event_public" ON public.event_public IS
	'Owners can directly read their own event_public records without needing to be in event_user, enabling realtime subscriptions to work immediately after event creation.';
