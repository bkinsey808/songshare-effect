ALTER TABLE public."user"
ADD COLUMN chord_display_mode text NOT NULL DEFAULT 'letters';

ALTER TABLE ONLY public."user"
REPLICA IDENTITY FULL;

ALTER TABLE public."user"
ADD CONSTRAINT user_chord_display_mode_check
CHECK (
	chord_display_mode = ANY (
		ARRAY['letters'::text, 'solfege'::text, 'indian'::text, 'german'::text, 'roman'::text]
	)
);

COMMENT ON COLUMN public."user".chord_display_mode IS
'Global chord display mode for the signed-in user: letters, solfege, indian, german, or roman.';
