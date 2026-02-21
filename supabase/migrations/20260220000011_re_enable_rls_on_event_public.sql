-- Re-enable RLS on event_public and add UPDATE/DELETE policies
-- This ensures row-level security is enforced at the database level

-- Re-enable RLS on the event_public table
ALTER TABLE public.event_public ENABLE ROW LEVEL SECURITY;

-- Update table comment to reflect RLS status
COMMENT ON TABLE public.event_public IS 'Public event data with RLS enforcing owner/admin write access. Readable by authenticated users (public events) or participants. Realtime enabled for real-time sync.';

-- CREATE POLICY for UPDATE - owner can update their own event
CREATE POLICY "Allow owner to update own event_public" ON public.event_public
  FOR UPDATE
  USING (
    owner_id = (auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id')::uuid
  )
  WITH CHECK (
    owner_id = (auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id')::uuid
  );

-- CREATE POLICY for UPDATE - event_admin and event_playlist_admin can update
CREATE POLICY "Allow event admins to update event_public" ON public.event_public
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.event_user
      WHERE event_user.event_id = event_public.event_id
      AND event_user.user_id = (auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id')::uuid
      AND event_user.role IN ('event_admin', 'event_playlist_admin')
      AND event_user.status = 'joined'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_user
      WHERE event_user.event_id = event_public.event_id
      AND event_user.user_id = (auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id')::uuid
      AND event_user.role IN ('event_admin', 'event_playlist_admin')
      AND event_user.status = 'joined'
    )
  );

-- CREATE POLICY for DELETE - only owner can delete
CREATE POLICY "Allow owner to delete own event_public" ON public.event_public
  FOR DELETE
  USING (
    owner_id = (auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id')::uuid
  );
