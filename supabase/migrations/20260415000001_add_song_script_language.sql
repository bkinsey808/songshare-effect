-- Add `script` language field to song_public.
-- Date: 2026-04-15
--
-- `script` is an optional BCP 47 language code identifying which language
-- the presenter/leader notes are written in. Its content per slide is stored
-- in field_data under this code, exactly like lyrics and translations.
--
-- The three language roles are mutually exclusive:
--   lyrics  ≠ script
--   script  ∉ translations
--   lyrics  ∉ translations  (enforced by existing constraint)

BEGIN;

-- script: optional BCP 47 language code for presenter notes.
ALTER TABLE public.song_public
  ADD COLUMN IF NOT EXISTS script text;

-- script must be a valid BCP 47 tag when set.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'song_public_script_valid_bcp47'
      AND conrelid = 'public.song_public'::regclass
  ) THEN
    ALTER TABLE public.song_public
      ADD CONSTRAINT song_public_script_valid_bcp47
      CHECK (script IS NULL OR public.is_valid_bcp47(script));
  END IF;
END $$;

-- script must differ from lyrics.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'song_public_script_not_lyrics'
      AND conrelid = 'public.song_public'::regclass
  ) THEN
    ALTER TABLE public.song_public
      ADD CONSTRAINT song_public_script_not_lyrics
      CHECK (script IS NULL OR script <> lyrics);
  END IF;
END $$;

-- script must not appear in translations.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'song_public_script_not_in_translations'
      AND conrelid = 'public.song_public'::regclass
  ) THEN
    ALTER TABLE public.song_public
      ADD CONSTRAINT song_public_script_not_in_translations
      CHECK (script IS NULL OR NOT (script = ANY(translations)));
  END IF;
END $$;

COMMIT;
