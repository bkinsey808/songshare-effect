-- Add slide position tracking for events so duplicate slide IDs can be disambiguated.
ALTER TABLE public.event_public
ADD COLUMN IF NOT EXISTS active_slide_position integer;

ALTER TABLE public.event_public
DROP COLUMN IF EXISTS active_slide_id;

COMMENT ON COLUMN public.event_public.active_slide_position IS
'1-based active slide position within the active song order';
