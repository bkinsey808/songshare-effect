-- Migration: Allow reading event_public for events in user's library
-- Date: 2026-02-15 13:00:00
-- Description: Adds an RLS policy to allow users to read event_public rows for events
-- that exist in their personal library (event_library table). This enables proper
-- joining when fetching the event library UI without exposing private event data.

-- Add new policy: Allow reading event_public for events in user's library
CREATE POLICY "Allow read event_public for library events" ON public.event_public
    FOR SELECT TO authenticated
    USING (
        -- Event exists in user's library
        EXISTS (
            SELECT 1 FROM public.event_library
            WHERE event_library.event_id = event_public.event_id
            AND event_library.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
        )
    );

COMMENT ON POLICY "Allow read event_public for library events" ON public.event_public IS 
'Users can read public event data for events in their personal library (without needing to be owner or participant).';
