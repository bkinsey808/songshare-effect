-- Reintroduce `left` as a first-class event membership status.
--
-- Status model after this migration:
-- - invited
-- - joined
-- - left
-- - kicked

-- 1) Allow `left` in status constraint.
ALTER TABLE public.event_user
	DROP CONSTRAINT IF EXISTS event_user_status_check;

ALTER TABLE public.event_user
	ADD CONSTRAINT event_user_status_check
	CHECK (
		status = ANY (
			ARRAY[
				'invited'::text,
				'joined'::text,
				'left'::text,
				'kicked'::text
			]
		)
	);

-- 2) Let left users fetch event metadata (app layer still gates full/slides to joined only).
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
			AND event_user.status = ANY (
				ARRAY[
					'invited'::text,
					'joined'::text,
					'left'::text
				]
			)
	)
);

-- 3) Let users read their own left rows too (kicked remains hidden).
DROP POLICY IF EXISTS "Users can access their own event entries" ON public.event_user;

CREATE POLICY "Users can access their own event entries"
ON public.event_user
FOR SELECT
TO authenticated
USING (
	user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
	AND status = ANY (
		ARRAY[
			'invited'::text,
			'joined'::text,
			'left'::text
		]
	)
);

COMMENT ON COLUMN public.event_user.status IS
	'Membership status in this event: invited, joined, left, or kicked';
