-- Normalize slide background image metadata in `song_public.slides`.
-- Date: 2026-03-28
-- This migration is idempotent.
--
-- For slide objects that still have `background_image_r2_key`:
-- 1) write `background_image_url` as `/api/images/serve/<background_image_r2_key>` if missing
-- 2) remove `background_image_r2_key`

BEGIN;

WITH to_fix AS (
  SELECT sp.song_id, sp.slides
  FROM public.song_public sp
  WHERE EXISTS (
    SELECT 1
    FROM jsonb_each(sp.slides) AS s(slide_id, slide_val)
    WHERE jsonb_typeof(s.slide_val) = 'object'
      AND (s.slide_val ? 'background_image_r2_key')
      AND jsonb_typeof(s.slide_val->'background_image_r2_key') = 'string'
  )
), normalized AS (
  SELECT
    t.song_id,
    (
      SELECT jsonb_object_agg(
        s.slide_id,
        CASE
          WHEN jsonb_typeof(s.slide_val) = 'object'
            AND (s.slide_val ? 'background_image_r2_key')
            AND jsonb_typeof(s.slide_val->'background_image_r2_key') = 'string'
          THEN
            (
              CASE
                WHEN NOT (s.slide_val ? 'background_image_url')
                THEN jsonb_set(
                  s.slide_val,
                  '{background_image_url}',
                  to_jsonb('/api/images/serve/' || (s.slide_val->>'background_image_r2_key')),
                  true
                )
                ELSE s.slide_val
              END
            ) - 'background_image_r2_key'
          ELSE s.slide_val
        END
      )
      FROM jsonb_each(t.slides) AS s(slide_id, slide_val)
    ) AS new_slides
  FROM to_fix t
)
UPDATE public.song_public sp
SET slides = n.new_slides
FROM normalized n
WHERE sp.song_id = n.song_id
  AND n.new_slides IS NOT NULL
  AND sp.slides IS DISTINCT FROM n.new_slides;

COMMIT;
