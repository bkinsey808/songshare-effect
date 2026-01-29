-- Enable Realtime for playlist_public and playlist_library tables
-- This allows the frontend to receive updates when playlist data changes

-- ============================================================================
-- playlist_public realtime
-- ============================================================================

-- Set REPLICA IDENTITY to FULL so realtime can receive full row data for updates
ALTER TABLE public.playlist_public REPLICA IDENTITY FULL;

-- Add the table to the realtime publication so changes are broadcast
-- Use DO block to make this idempotent (won't error if already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'playlist_public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.playlist_public;
    END IF;
END $$;

-- ============================================================================
-- playlist_library realtime
-- ============================================================================

-- REPLICA IDENTITY FULL already set in create_playlist_tables migration

-- Add the table to the realtime publication so changes are broadcast
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'playlist_library'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.playlist_library;
    END IF;
END $$;
