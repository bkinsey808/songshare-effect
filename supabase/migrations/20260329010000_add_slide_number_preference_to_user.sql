ALTER TABLE public."user"
ADD COLUMN slide_number_preference text NOT NULL DEFAULT 'hide';

ALTER TABLE ONLY public."user"
REPLICA IDENTITY FULL;

ALTER TABLE public."user"
ADD CONSTRAINT user_slide_number_preference_check
CHECK (
	slide_number_preference = ANY (
		ARRAY['show'::text, 'hide'::text]
	)
);

COMMENT ON COLUMN public."user".slide_number_preference IS
'Global slide number preference for the signed-in user: show or hide.';
