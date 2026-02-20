-- Add explicit membership status and expand event roles for split role/status model.
--
-- Status model:
-- - invited
-- - joined
-- - kicked
--
-- Role model:
-- - owner
-- - event_admin
-- - event_playlist_admin
-- - participant
--
-- Legacy bridge:
-- - admin remains temporarily allowed and treated by application logic as playlist-admin.

-- 1) Add membership status to event_user.
ALTER TABLE public.event_user
	ADD COLUMN IF NOT EXISTS status text;

UPDATE public.event_user
SET status = 'joined'
WHERE status IS NULL;

ALTER TABLE public.event_user
	ALTER COLUMN status SET DEFAULT 'joined';

ALTER TABLE public.event_user
	ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.event_user
	DROP CONSTRAINT IF EXISTS event_user_status_check;

ALTER TABLE public.event_user
	ADD CONSTRAINT event_user_status_check
	CHECK (status = ANY (ARRAY['invited'::text, 'joined'::text, 'kicked'::text]));

CREATE INDEX IF NOT EXISTS event_user_status_idx ON public.event_user USING btree (status);

-- 2) Expand role check to new role model while retaining legacy 'admin' during rollout.
ALTER TABLE public.event_user
	DROP CONSTRAINT IF EXISTS event_user_role_check;

ALTER TABLE public.event_user
	ADD CONSTRAINT event_user_role_check
	CHECK (
		role = ANY (
			ARRAY[
				'owner'::text,
				'event_admin'::text,
				'event_playlist_admin'::text,
				'participant'::text,
				'admin'::text
			]
		)
	);

-- 3) Update event_public update policy to include new admin roles.
DROP POLICY IF EXISTS "Allow admins to update event fields" ON public.event_public;

CREATE POLICY "Allow admins to update event fields"
ON public.event_public
FOR UPDATE
TO authenticated
USING (
	EXISTS (
		SELECT 1
		FROM public.event_user
		WHERE event_user.event_id = event_public.event_id
			AND event_user.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
			AND event_user.role = ANY (
				ARRAY[
					'admin'::text,
					'event_admin'::text,
					'event_playlist_admin'::text
				]
			)
	)
)
WITH CHECK (
	EXISTS (
		SELECT 1
		FROM public.event_user
		WHERE event_user.event_id = event_public.event_id
			AND event_user.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
			AND event_user.role = ANY (
				ARRAY[
					'admin'::text,
					'event_admin'::text,
					'event_playlist_admin'::text
				]
			)
	)
);

-- 4) Keep schema documentation accurate.
COMMENT ON COLUMN public.event_user.role IS
	'User role in this event: owner, event_admin, event_playlist_admin, participant (legacy admin temporarily supported)';

COMMENT ON COLUMN public.event_user.status IS
	'Membership status in this event: invited, joined, or kicked';
