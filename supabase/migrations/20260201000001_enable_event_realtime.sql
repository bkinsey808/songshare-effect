-- Enable Supabase Realtime for event tables
-- This allows clients to subscribe to real-time changes for:
-- - event_public: Track changes to active playlist/song/slide in real-time
-- - event_user: Track participant additions/removals in real-time

-- Enable realtime for event_public table
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_public;

-- Enable realtime for event_user table
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_user;

-- Comments
COMMENT ON TABLE public.event_public IS 'Public event data - readable based on is_public flag and participant status. Realtime enabled for live event updates.';
COMMENT ON TABLE public.event_user IS 'Event participants with roles - manages who can access and modify events. Realtime enabled for participant tracking.';
