-- Enable realtime for sharing tables
-- This enables Supabase Realtime subscriptions for the sharing system tables

-- Add sharing tables to the supabase_realtime publication
-- This allows clients to subscribe to live changes on these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.share_public;
ALTER PUBLICATION supabase_realtime ADD TABLE public.share_library;

-- Note: public.share is not added to realtime publication as it contains
-- private data that should only be accessible via API endpoints