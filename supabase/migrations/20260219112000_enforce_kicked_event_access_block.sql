-- Enforce kicked-user access restrictions at the database RLS layer.
--
-- Goal:
-- - Kicked users cannot fetch event_public rows for that event
-- - Kicked users cannot read event_user rows for that event
-- - Realtime subscriptions are blocked as a consequence of denied SELECT access

-- 1) Restrict public event reads for authenticated users who are kicked from that event.
DROP POLICY IF EXISTS "Allow read access to public events for anyone" ON public.event_public;

CREATE POLICY "Allow read access to public events for anyone"
ON public.event_public
FOR SELECT
TO authenticated
USING (
	is_public = true
	AND NOT EXISTS (
		SELECT 1
		FROM public.event_user
		WHERE event_user.event_id = event_public.event_id
			AND event_user.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
			AND event_user.status = 'kicked'::text
	)
);

CREATE POLICY "Allow read access to public events for anonymous"
ON public.event_public
FOR SELECT
TO anon
USING (is_public = true);

-- 2) Restrict private event reads to invited/joined members only.
DROP POLICY IF EXISTS "Allow read access to private events for participants" ON public.event_public;

CREATE POLICY "Allow read access to private events for participants"
ON public.event_public
FOR SELECT
TO authenticated
USING (
	is_public = false
	AND EXISTS (
		SELECT 1
		FROM public.event_user
		WHERE event_user.event_id = event_public.event_id
			AND event_user.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
			AND event_user.status = ANY (ARRAY['invited'::text, 'joined'::text])
	)
);

-- 3) Restrict event_public library read bypass for kicked users.
DROP POLICY IF EXISTS "Allow read event_public for library events" ON public.event_public;

CREATE POLICY "Allow read event_public for library events"
ON public.event_public
FOR SELECT
TO authenticated
USING (
	EXISTS (
		SELECT 1
		FROM public.event_library
		WHERE event_library.event_id = event_public.event_id
			AND event_library.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
	)
	AND NOT EXISTS (
		SELECT 1
		FROM public.event_user
		WHERE event_user.event_id = event_public.event_id
			AND event_user.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
			AND event_user.status = 'kicked'::text
	)
);

-- 4) Restrict event_user row visibility to invited/joined memberships only.
DROP POLICY IF EXISTS "Users can access their own event entries" ON public.event_user;

CREATE POLICY "Users can access their own event entries"
ON public.event_user
FOR SELECT
TO authenticated
USING (
	user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
	AND status = ANY (ARRAY['invited'::text, 'joined'::text])
);

COMMENT ON POLICY "Allow read access to private events for participants" ON public.event_public IS
	'Private events are readable only by invited/joined users; kicked users are denied.';

COMMENT ON POLICY "Users can access their own event entries" ON public.event_user IS
	'Users can read only their own invited/joined membership rows; kicked rows are hidden to block fetch/subscription.';
