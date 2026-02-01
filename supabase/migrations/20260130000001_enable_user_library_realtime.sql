-- Enable Realtime for user_library table
-- This migration adds the table to the realtime publication so changes are broadcast

-- Set REPLICA IDENTITY to FULL so realtime can receive full row data for updates/deletes
ALTER TABLE public.user_library REPLICA IDENTITY FULL;

-- Add the table to the realtime publication so changes are broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_library;

-- Add helpful comment (idempotent update)
COMMENT ON TABLE public.user_library IS 'Personal user libraries - allows users to follow other users. Realtime enabled.';
