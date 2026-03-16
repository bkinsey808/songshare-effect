-- Enable Realtime for image-related tables
-- image_public and image_library already have REPLICA IDENTITY FULL set

ALTER PUBLICATION supabase_realtime ADD TABLE public.image_public;
ALTER PUBLICATION supabase_realtime ADD TABLE public.image_library;
