-- Enable Realtime for song_library table
-- This migration fixes the "mismatch between server and client bindings" error

-- Set REPLICA IDENTITY to FULL so realtime can receive full row data for updates/deletes
ALTER TABLE public.song_library REPLICA IDENTITY FULL;

-- Add the table to the realtime publication so changes are broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE public.song_library;

-- Add helpful comment
COMMENT ON TABLE public.song_library IS 'Personal song libraries - allows users to collect songs (their own or others'') into their personal library. Realtime enabled.';
