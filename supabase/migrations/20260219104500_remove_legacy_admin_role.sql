-- Remove legacy `admin` event role after migration to explicit role model.
--
-- This migration is intended to run after:
-- 20260219103000_add_event_user_status_and_new_roles.sql

-- 1) Backfill remaining legacy rows.
UPDATE public.event_user
SET role = 'event_playlist_admin'
WHERE role = 'admin';

-- 2) Tighten role constraint to canonical values only.
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
				'participant'::text
			]
		)
	);

-- 3) Tighten event_public admin policy to canonical admin roles only.
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
					'event_admin'::text,
					'event_playlist_admin'::text
				]
			)
	)
);

-- 4) Update documentation comment.
COMMENT ON COLUMN public.event_user.role IS
	'User role in this event: owner, event_admin, event_playlist_admin, or participant';
