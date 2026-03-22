-- Enable realtime subscription for community_library table
-- This allows clients to receive real-time updates when communities are added/removed from libraries

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_library;
