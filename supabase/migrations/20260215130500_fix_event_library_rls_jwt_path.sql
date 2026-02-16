-- Fix RLS policies for event_library to use correct JWT path
-- Date: 2026-02-15 13:05:00
-- Description: Corrects the JWT path in event_library RLS policies to match
-- the actual JWT structure used throughout the application.
-- The correct path is: auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'

-- Drop existing policies with incorrect JWT path
DROP POLICY IF EXISTS event_library_select_own_entries ON public.event_library;
DROP POLICY IF EXISTS event_library_insert_own_entries ON public.event_library;
DROP POLICY IF EXISTS event_library_delete_own_entries ON public.event_library;

-- Re-create policies with CORRECT JWT path

-- Policy 1: Users can SELECT their own library entries
CREATE POLICY event_library_select_own_entries ON public.event_library
    FOR SELECT
    TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- Policy 2: Users can INSERT into their own library
CREATE POLICY event_library_insert_own_entries ON public.event_library
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- Policy 3: Users can DELETE their own library entries
CREATE POLICY event_library_delete_own_entries ON public.event_library
    FOR DELETE
    TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);
