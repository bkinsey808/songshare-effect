-- Drop legacy `song_public.fields` after normalizing slide field_data keys.
-- Date: 2026-04-16
--
-- This follow-up migration completes the language-column migration by:
-- 1. Backfilling `translations = ARRAY['en']` for rows that still carry
--    legacy `enTranslation` slide content but have no declared translations.
-- 2. Rebuilding every slide's `field_data` object so it uses only the current
--    language-code keys from `{lyrics} ∪ {script} ∪ translations`.
-- 3. Dropping the obsolete `fields text[]` compatibility column.

BEGIN;

-- Legacy `enTranslation` represented a single English translation slot.
-- Promote that slot into the new `translations` column when the row has not
-- declared any translations yet and English is still a valid disjoint choice.
UPDATE public.song_public AS sp
SET translations = ARRAY['en']::text[]
WHERE COALESCE(array_length(sp.translations, 1), 0) = 0
  AND sp.lyrics <> 'en'
  AND (sp.script IS NULL OR sp.script <> 'en')
  AND EXISTS (
    SELECT 1
    FROM jsonb_each(sp.slides) AS slide(slide_id, slide_value)
    WHERE COALESCE(slide.slide_value->'field_data'->>'enTranslation', '') <> ''
  );

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
                  sp.lyrics AS field_key,
                  COALESCE(
                    sp.slides->slide_key->'field_data'->>sp.lyrics,
                    sp.slides->slide_key->'field_data'->>'lyrics',
                    ''
                  ) AS field_value

                UNION ALL

                SELECT
                  sp.script AS field_key,
                  COALESCE(
                    sp.slides->slide_key->'field_data'->>sp.script,
                    sp.slides->slide_key->'field_data'->>'script',
                    ''
                  ) AS field_value
                WHERE sp.script IS NOT NULL

                UNION ALL

                SELECT
                  translation.code AS field_key,
                  CASE
                    WHEN translation.ordinality = 1 THEN COALESCE(
                      sp.slides->slide_key->'field_data'->>translation.code,
                      sp.slides->slide_key->'field_data'->>'enTranslation',
                      ''
                    )
                    ELSE COALESCE(
                      sp.slides->slide_key->'field_data'->>translation.code,
                      ''
                    )
                  END AS field_value
                FROM unnest(sp.translations) WITH ORDINALITY AS translation(code, ordinality)
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

ALTER TABLE public.song_public
  DROP COLUMN IF EXISTS fields;

COMMIT;
