ALTER TABLE public."user"
DROP CONSTRAINT IF EXISTS user_chord_display_mode_check;

ALTER TABLE public."user"
DROP COLUMN IF EXISTS chord_display_mode;
