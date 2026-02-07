-- Enable realtime subscription for event_library table
-- This allows clients to receive real-time updates when events are added/removed from libraries

ALTER PUBLICATION supabase_realtime ADD TABLE public.event_library;
