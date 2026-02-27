-- Completely open up community_user for debugging
DROP POLICY IF EXISTS "Community owners can see all members" ON public.community_user;
DROP POLICY IF EXISTS "Community admins can see all members" ON public.community_user;
DROP POLICY IF EXISTS "Users can access their own community entries" ON public.community_user;
DROP POLICY IF EXISTS "Deny all mutations on community_user" ON public.community_user;
DROP POLICY IF EXISTS "debug_all_read" ON public.community_user;
DROP POLICY IF EXISTS "debug_all_read_anon" ON public.community_user;

CREATE POLICY "open_read" ON public.community_user FOR SELECT USING (true);
