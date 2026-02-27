-- Temporary debug policy to rule out role issues
DROP POLICY IF EXISTS "debug_all_read" ON public.community_user;
CREATE POLICY "debug_all_read" ON public.community_user FOR SELECT TO authenticated USING (true);
