-- Drop the potentially recursive/problematic policy
DROP POLICY IF EXISTS "Admins can access all entries for their communities" ON public.community_user;

-- Add a robust policy for community owners to see all members
-- This uses community_public which has a broad SELECT policy (authenticated USING true)
-- to avoid recursion issues within community_user.
CREATE POLICY "Community owners can see all members" ON public.community_user 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.community_public cp 
    WHERE cp.community_id = community_user.community_id 
    AND cp.owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
  )
);

-- Add a policy for community admins to see all members
-- This one still references community_user but since owners can now see all rows,
-- the recursion has a clear non-recursive path for the most important case.
CREATE POLICY "Community admins can see all members" ON public.community_user
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.community_user cu
    WHERE cu.community_id = community_user.community_id
    AND cu.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
    AND cu.role = 'community_admin'::text
  )
);
