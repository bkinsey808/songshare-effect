-- Add strongly-typed language fields to song_public.
-- Date: 2026-04-15
--
-- Replaces the loosely-typed `fields text[]` column with two structured columns:
--
--   lyrics       text NOT NULL  -- BCP 47 code for the song's original language ("en", "sa")
--   translations text[]         -- ordered BCP 47 codes for additional languages ("sa-Latn", "es")
--
-- Together {lyrics} ∪ translations defines the exact set of keys that may appear
-- in each slide's `field_data` JSONB object.
--
-- The `fields` column is retained during this migration. It will be dropped in a
-- follow-up migration once all app code has been updated and existing slide
-- `field_data` keys have been migrated to BCP 47 codes.
--
-- A trigger enforcing that slide field_data keys match {lyrics} ∪ translations is
-- also deferred to a follow-up migration, after the field_data key migration is
-- complete (existing rows use legacy keys "lyrics", "script", "enTranslation").
--
-- Note: PostgreSQL CHECK constraints cannot contain subqueries, so array-level
-- validations are wrapped in IMMUTABLE helper functions.

BEGIN;

-- Helper: validate a single BCP 47 language tag.
-- Accepts: 2-3 letter language ("en", "grc"), optionally followed by
-- dash-separated subtags for script/region ("zh-Hans", "pt-BR", "sa-Latn").
CREATE OR REPLACE FUNCTION public.is_valid_bcp47(code text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE STRICT
AS $$ SELECT code ~ '^[a-z]{2,3}(-[A-Za-z0-9]+)*$' $$;

-- Helper: validate every element of a text array against BCP 47.
-- Returns true for empty arrays (vacuously valid).
CREATE OR REPLACE FUNCTION public.are_all_valid_bcp47(codes text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE STRICT
AS $$ SELECT COALESCE(bool_and(code ~ '^[a-z]{2,3}(-[A-Za-z0-9]+)*$'), true) FROM unnest(codes) code $$;

-- Helper: return true when a text array contains no duplicate values.
-- Returns true for empty arrays.
CREATE OR REPLACE FUNCTION public.array_has_no_duplicates(arr text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE STRICT
AS $$ SELECT COUNT(*) = COUNT(DISTINCT v) FROM unnest(arr) v $$;

-- lyrics: required BCP 47 language code for the song's original language.
ALTER TABLE public.song_public
  ADD COLUMN IF NOT EXISTS lyrics text NOT NULL DEFAULT 'en';

-- translations: ordered array of additional BCP 47 language codes.
ALTER TABLE public.song_public
  ADD COLUMN IF NOT EXISTS translations text[] NOT NULL DEFAULT '{}';

-- lyrics must be a valid BCP 47 tag.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'song_public_lyrics_valid_bcp47'
      AND conrelid = 'public.song_public'::regclass
  ) THEN
    ALTER TABLE public.song_public
      ADD CONSTRAINT song_public_lyrics_valid_bcp47
      CHECK (public.is_valid_bcp47(lyrics));
  END IF;
END $$;

-- Every element of translations must be a valid BCP 47 tag.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'song_public_translations_valid_bcp47'
      AND conrelid = 'public.song_public'::regclass
  ) THEN
    ALTER TABLE public.song_public
      ADD CONSTRAINT song_public_translations_valid_bcp47
      CHECK (public.are_all_valid_bcp47(translations));
  END IF;
END $$;

-- lyrics must not appear in translations (sets are disjoint).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'song_public_lyrics_not_in_translations'
      AND conrelid = 'public.song_public'::regclass
  ) THEN
    ALTER TABLE public.song_public
      ADD CONSTRAINT song_public_lyrics_not_in_translations
      CHECK (NOT (lyrics = ANY(translations)));
  END IF;
END $$;

-- translations must not contain duplicate language codes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'song_public_translations_no_duplicates'
      AND conrelid = 'public.song_public'::regclass
  ) THEN
    ALTER TABLE public.song_public
      ADD CONSTRAINT song_public_translations_no_duplicates
      CHECK (public.array_has_no_duplicates(translations));
  END IF;
END $$;

COMMIT;
