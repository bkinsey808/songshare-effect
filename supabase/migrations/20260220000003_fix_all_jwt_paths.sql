-- Fix all RLS policies to use the correct JWT path
-- The sessionData JWT has structure: { user: { user_id: ... }, ... }
-- NOT: { app_metadata: { user: { user_id: ... } } }

-- 1. Fix "Allow read access to public events for anyone" policy
DROP POLICY IF EXISTS "Allow read access to public events for anyone" ON public.event_public;

CREATE POLICY "Allow read access to public events for anyone"
ON public.event_public
FOR SELECT
TO authenticated
USING (
	(is_public = true) AND 
	NOT (EXISTS (
		SELECT 1
		FROM public.event_user
		WHERE 
			event_user.event_id = event_public.event_id AND
			event_user.user_id = ((auth.jwt() -> 'user' ->> 'user_id')::uuid) AND
			event_user.status = 'kicked'::text
	))
);

-- 2. Fix "Allow owner to update all fields" policy
DROP POLICY IF EXISTS "Allow owner to update all fields" ON public.event_public;

CREATE POLICY "Allow owner to update all fields"
ON public.event_public
FOR UPDATE
TO authenticated
USING (
	owner_id = ((auth.jwt() -> 'user' ->> 'user_id')::uuid)
)
WITH CHECK (
	owner_id = ((auth.jwt() -> 'user' ->> 'user_id')::uuid)
);

-- 3. Fix "Allow admins to update event fields" policy - it may also use old JWT path
DROP POLICY IF EXISTS "Allow admins to update event fields" ON public.event_public;

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
			event_user.user_id = ((auth.jwt() -> 'user' ->> 'user_id')::uuid) AND
			event_user.role IN ('admin', 'playlist-admin')
	)
)
WITH CHECK (
	EXISTS (
		SELECT 1
		FROM public.event_user
		WHERE
			event_user.event_id = event_public.event_id AND
			event_user.user_id = ((auth.jwt() -> 'user' ->> 'user_id')::uuid) AND
			event_user.role IN ('admin', 'playlist-admin')
	)
);

-- 4. Fix "Allow read access to private events for participants" policy
DROP POLICY IF EXISTS "Allow read access to private events for participants" ON public.event_public;

CREATE POLICY "Allow read access to private events for participants"
ON public.event_public
FOR SELECT
TO authenticated
USING (
	(is_public = false) AND
	EXISTS (
		SELECT 1
		FROM public.event_user
		WHERE
			event_user.event_id = event_public.event_id AND
			event_user.user_id = ((auth.jwt() -> 'user' ->> 'user_id')::uuid) AND
			event_user.status IN ('invited', 'joined', 'left')
	)
);
