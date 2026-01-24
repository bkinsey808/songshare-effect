-- Backfill missing `field_data` entries for slides in `song_public.slides`
-- Date: 2026-01-24
-- This migration is idempotent: re-running it will not alter rows that already contain the
-- expected keys.

BEGIN;

-- Diagnostic: (run manually to preview affected rows before applying)
-- SELECT song_id FROM public.song_public sp
-- WHERE EXISTS (
--   SELECT 1 FROM jsonb_each(sp.slides) AS s(slide_id, slide_val)
--   WHERE EXISTS (
--     SELECT 1 FROM unnest(sp.fields) AS f
--     WHERE NOT ((s.slide_val->'field_data') ? f)
--   )
-- );

-- Build normalized slides for only the rows that are missing required keys.
WITH to_fix AS (
  SELECT sp.song_id, sp.fields, sp.slides
  FROM public.song_public sp
  WHERE EXISTS (
    SELECT 1 FROM jsonb_each(sp.slides) AS s(slide_id, slide_val)
    WHERE EXISTS (
      SELECT 1 FROM unnest(sp.fields) AS f
      WHERE NOT ((s.slide_val->'field_data') ? f)
    )
  )
), normalized AS (
  SELECT song_id,
    (
      SELECT jsonb_object_agg(slide_key, new_slide) FROM (
        SELECT slide_key,
          -- For each slide, set `field_data` to an object that contains every field
          -- from `fields`, defaulting missing values to an empty string.
          jsonb_set(to_fix.slides->slide_key, '{field_data}', (
            SELECT jsonb_object_agg(f, to_jsonb(COALESCE((to_fix.slides->slide_key->'field_data')->>f, '')))
            FROM unnest(to_fix.fields) AS f
          )::jsonb, true) AS new_slide
        FROM jsonb_object_keys(to_fix.slides) AS slide_key
      ) s
    ) AS new_slides
  FROM to_fix
)
UPDATE public.song_public p
SET slides = n.new_slides
FROM normalized n
WHERE p.song_id = n.song_id
  AND n.new_slides IS NOT NULL;

COMMIT;
