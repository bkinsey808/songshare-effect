-- Enable Realtime for song_public table
-- This allows the frontend to receive updates when song metadata (like name or slug) changes

-- Set REPLICA IDENTITY to FULL so realtime can receive full row data for updates
ALTER TABLE public.song_public REPLICA IDENTITY FULL;

-- Add the table to the realtime publication so changes are broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE public.song_public;

-- Add helpful comment
COMMENT ON TABLE public.song_public IS 'Public song metadata. Realtime enabled for metadata updates.';
