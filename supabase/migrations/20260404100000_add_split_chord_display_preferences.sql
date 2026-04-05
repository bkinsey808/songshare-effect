ALTER TABLE public."user"
ADD COLUMN chord_display_category text NOT NULL DEFAULT 'scale_degree';

ALTER TABLE public."user"
ADD COLUMN chord_letter_display text NOT NULL DEFAULT 'standard';

ALTER TABLE public."user"
ADD COLUMN chord_scale_degree_display text NOT NULL DEFAULT 'roman';

UPDATE public."user"
SET
	chord_display_category = CASE
		WHEN chord_display_mode = 'letters' OR chord_display_mode = 'german' THEN 'letters'
		ELSE 'scale_degree'
	END,
	chord_letter_display = CASE
		WHEN chord_display_mode = 'german' THEN 'german'
		ELSE 'standard'
	END,
	chord_scale_degree_display = CASE
		WHEN chord_display_mode = 'solfege' THEN 'solfege'
		WHEN chord_display_mode = 'indian' THEN 'sargam'
		ELSE 'roman'
	END;

ALTER TABLE public."user"
ADD CONSTRAINT user_chord_display_category_check
CHECK (
	chord_display_category = ANY (
		ARRAY['letters'::text, 'scale_degree'::text]
	)
);

ALTER TABLE public."user"
ADD CONSTRAINT user_chord_letter_display_check
CHECK (
	chord_letter_display = ANY (
		ARRAY['standard'::text, 'german'::text]
	)
);

ALTER TABLE public."user"
ADD CONSTRAINT user_chord_scale_degree_display_check
CHECK (
	chord_scale_degree_display = ANY (
		ARRAY['roman'::text, 'solfege'::text, 'sargam'::text]
	)
);

COMMENT ON COLUMN public."user".chord_display_category IS
'Active chord display category for the signed-in user: letters or scale_degree.';

COMMENT ON COLUMN public."user".chord_letter_display IS
'Preferred chord letter display for the signed-in user: standard or german.';

COMMENT ON COLUMN public."user".chord_scale_degree_display IS
'Preferred chord scale degree display for the signed-in user: roman, solfege, or sargam.';
