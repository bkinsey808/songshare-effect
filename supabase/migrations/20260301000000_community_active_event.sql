-- Add active_event_id to community_public and enable realtime for community tables.
--
-- Changes:
-- 1. Add active_event_id (nullable FK → event) to community_public.
--    The active event is displayed automatically on the Community View page.
--    ON DELETE SET NULL ensures no orphan reference if the event is deleted.
--
-- 2. Enable REPLICA IDENTITY FULL on community_event so that DELETE payloads
--    in Supabase Realtime include the full old row (community_id + event_id).
--    Without this, DELETE events only carry the PK — not enough for the
--    frontend to identify which entry was removed.
--
-- 3. Add community_public and community_event to the supabase_realtime
--    publication so clients can subscribe to live changes.
--    community_public already has REPLICA IDENTITY FULL (set in the original
--    create_community_tables migration); only the publication membership was
--    missing.

-- 1. Add active_event_id column
ALTER TABLE public.community_public
  ADD COLUMN active_event_id uuid
  REFERENCES public.event(event_id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.community_public.active_event_id IS
  'The currently active event for this community, shown automatically on the Community View page. Nullable; set/unset by community owners and admins via the API.';

-- 2. Set REPLICA IDENTITY FULL on community_event
ALTER TABLE public.community_event REPLICA IDENTITY FULL;

-- 3. Register both tables in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_public;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_event;
