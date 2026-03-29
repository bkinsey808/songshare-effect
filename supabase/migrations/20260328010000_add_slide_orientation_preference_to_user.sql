ALTER TABLE public."user"
ADD COLUMN slide_orientation_preference text NOT NULL DEFAULT 'system';

ALTER TABLE ONLY public."user"
REPLICA IDENTITY FULL;

ALTER TABLE public."user"
ADD CONSTRAINT user_slide_orientation_preference_check
CHECK (
	slide_orientation_preference = ANY (
		ARRAY['landscape'::text, 'portrait'::text, 'system'::text]
	)
);

COMMENT ON COLUMN public."user".slide_orientation_preference IS
'Global slide orientation preference for the signed-in user: landscape, portrait, or system.';

CREATE POLICY "Allow users to read own user row"
ON public."user"
FOR SELECT
TO authenticated
USING (
	user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
);

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime'
			AND schemaname = 'public'
			AND tablename = 'user'
	) THEN
		ALTER PUBLICATION supabase_realtime ADD TABLE public."user";
	END IF;
END
$$;
