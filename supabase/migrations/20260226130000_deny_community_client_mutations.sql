-- Drop existing update/mutation policies for community tables
DROP POLICY IF EXISTS "Allow owner to update own community_public" ON public.community_public;
DROP POLICY IF EXISTS "Allow admins to update community_public" ON public.community_public;
DROP POLICY IF EXISTS "Admins can manage community events" ON public.community_event;

-- 1. community
CREATE POLICY "Deny all mutations on community" ON public.community
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

COMMENT ON POLICY "Deny all mutations on community" ON public.community IS 'All community mutations must go through the API server for proper validation and authorization.';

-- 2. community_public
CREATE POLICY "Deny all mutations on community_public" ON public.community_public
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

COMMENT ON POLICY "Deny all mutations on community_public" ON public.community_public IS 'All community mutations must go through the API server for proper validation and authorization.';

-- 3. community_user
CREATE POLICY "Deny all mutations on community_user" ON public.community_user
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

COMMENT ON POLICY "Deny all mutations on community_user" ON public.community_user IS 'All community membership mutations must go through the API server for proper validation and authorization.';

-- 4. community_event
CREATE POLICY "Deny all mutations on community_event" ON public.community_event
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

COMMENT ON POLICY "Deny all mutations on community_event" ON public.community_event IS 'All community event association mutations must go through the API server for proper validation and authorization.';
