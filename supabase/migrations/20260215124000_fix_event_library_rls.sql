-- Fix RLS policies for event_library to match actual JWT structure
-- The current JWT implementation puts 'user' at the root of the payload, not inside 'app_metadata'.
-- Previous migrations expected: auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'
-- Actual JWT structure: auth.jwt() -> 'user' ->> 'user_id'

-- Drop existing policies
DROP POLICY IF EXISTS event_library_select_own_entries ON public.event_library;
DROP POLICY IF EXISTS event_library_insert_own_entries ON public.event_library;
DROP POLICY IF EXISTS event_library_delete_own_entries ON public.event_library;

-- Re-create policies with correct path

-- Policy 1: Users can SELECT their own library entries
CREATE POLICY event_library_select_own_entries ON public.event_library
    FOR SELECT
    TO authenticated
    USING (user_id = ((auth.jwt() -> 'user' ->> 'user_id'))::uuid);

-- Policy 2: Users can INSERT into their own library
CREATE POLICY event_library_insert_own_entries ON public.event_library
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = ((auth.jwt() -> 'user' ->> 'user_id'))::uuid);

-- Policy 3: Users can DELETE their own library entries
CREATE POLICY event_library_delete_own_entries ON public.event_library
    FOR DELETE
    TO authenticated
    USING (user_id = ((auth.jwt() -> 'user' ->> 'user_id'))::uuid);
