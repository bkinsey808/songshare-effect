-- Enable Realtime for song_public table
-- This allows the frontend to receive updates when song metadata (like name or slug) changes

-- Set REPLICA IDENTITY to FULL so realtime can receive full row data for updates
ALTER TABLE public.song_public REPLICA IDENTITY FULL;

-- Add the table to the realtime publication so changes are broadcast
-- Use DO block to make this idempotent (won't error if already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'song_public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.song_public;
    END IF;
END $$;

-- Add helpful comment
COMMENT ON TABLE public.song_public IS 'Public song metadata. Realtime enabled for metadata updates.';
