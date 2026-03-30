-- Persist image focal points for cropped renders and keep existing images centered.

ALTER TABLE public.image_public
	ADD COLUMN focal_point_x double precision NOT NULL DEFAULT 50,
	ADD COLUMN focal_point_y double precision NOT NULL DEFAULT 50;

COMMENT ON COLUMN public.image_public.focal_point_x IS 'Horizontal focal point percentage for cropped renders (0 = left, 100 = right)';
COMMENT ON COLUMN public.image_public.focal_point_y IS 'Vertical focal point percentage for cropped renders (0 = top, 100 = bottom)';
