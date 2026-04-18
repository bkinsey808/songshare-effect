-- Multi-language lyrics and script support.
-- Date: 2026-04-17
--
-- Reverts `field_data` keys to "lyrics" and "script" because these fields can now
-- represent arrays of languages. Changes `lyrics` and `script` columns to text[].

BEGIN;

-- 1. Backfill field_data keys.
WITH normalized AS (
  SELECT
    sp.song_id,
    (
      SELECT jsonb_object_agg(slide_key, normalized_slide)
      FROM (
        SELECT
          slide_key,
          jsonb_set(
            sp.slides->slide_key,
            '{field_data}',
            (
              SELECT jsonb_object_agg(field_key, to_jsonb(field_value))
              FROM (
                SELECT
                  'lyrics' AS field_key,
                  COALESCE(
                    sp.slides->slide_key->'field_data'->>(sp.lyrics::text),
                    sp.slides->slide_key->'field_data'->>'lyrics',
                    ''
                  ) AS field_value

                UNION ALL

                SELECT
                  'script' AS field_key,
                  COALESCE(
                    sp.slides->slide_key->'field_data'->>(sp.script::text),
                    sp.slides->slide_key->'field_data'->>'script',
                    ''
                  ) AS field_value
                WHERE sp.script IS NOT NULL

                UNION ALL

                SELECT
                  translation.code AS field_key,
                  COALESCE(
                    sp.slides->slide_key->'field_data'->>(translation.code::text),
                    ''
                  ) AS field_value
                FROM unnest(sp.translations) AS translation(code)
              ) AS normalized_fields
            )::jsonb,
            true
          ) AS normalized_slide
        FROM jsonb_object_keys(sp.slides) AS slide_key
      ) AS per_slide
    ) AS new_slides
  FROM public.song_public AS sp
)
UPDATE public.song_public AS sp
SET slides = normalized.new_slides
FROM normalized
WHERE sp.song_id = normalized.song_id
  AND normalized.new_slides IS NOT NULL;

-- 2. Drop old constraints.
ALTER TABLE public.song_public
  DROP CONSTRAINT IF EXISTS song_public_lyrics_valid_bcp47,
  DROP CONSTRAINT IF EXISTS song_public_script_valid_bcp47,
  DROP CONSTRAINT IF EXISTS song_public_lyrics_not_in_translations,
  DROP CONSTRAINT IF EXISTS song_public_script_not_lyrics,
  DROP CONSTRAINT IF EXISTS song_public_script_not_in_translations,
  DROP CONSTRAINT IF EXISTS song_public_lyrics_not_empty,
  DROP CONSTRAINT IF EXISTS song_public_lyrics_no_duplicates,
  DROP CONSTRAINT IF EXISTS song_public_script_no_duplicates;

-- 3. Alter columns.
ALTER TABLE public.song_public
  ALTER COLUMN lyrics DROP DEFAULT,
  ALTER COLUMN lyrics TYPE text[] USING ARRAY[lyrics],
  ALTER COLUMN lyrics SET DEFAULT '{en}'::text[];

ALTER TABLE public.song_public
  ALTER COLUMN script DROP DEFAULT,
  ALTER COLUMN script TYPE text[] USING (CASE WHEN script IS NOT NULL THEN ARRAY[script] ELSE '{}'::text[] END),
  ALTER COLUMN script SET DEFAULT '{}'::text[],
  ALTER COLUMN script SET NOT NULL;

-- 4. Add new constraints.
ALTER TABLE public.song_public
  ADD CONSTRAINT song_public_lyrics_valid_bcp47
    CHECK (public.are_all_valid_bcp47(lyrics)),
  ADD CONSTRAINT song_public_lyrics_not_empty
    CHECK (COALESCE(array_length(lyrics, 1), 0) > 0),
  ADD CONSTRAINT song_public_lyrics_no_duplicates
    CHECK (public.array_has_no_duplicates(lyrics)),
  ADD CONSTRAINT song_public_script_valid_bcp47
    CHECK (public.are_all_valid_bcp47(script)),
  ADD CONSTRAINT song_public_script_no_duplicates
    CHECK (public.array_has_no_duplicates(script)),
  ADD CONSTRAINT song_public_lyrics_not_in_translations
    CHECK (NOT (lyrics && translations)),
  ADD CONSTRAINT song_public_script_not_lyrics
    CHECK (NOT (script && lyrics)),
  ADD CONSTRAINT song_public_script_not_in_translations
    CHECK (NOT (script && translations));

COMMIT;
