-- Create helper functions to break recursion and bypass RLS for checks
-- SECURITY DEFINER allows these functions to see all rows regardless of RLS on the tables they query.

CREATE OR REPLACE FUNCTION public.is_community_owner(p_community_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.community_public
    WHERE community_id = p_community_id
    AND owner_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_community_admin(p_community_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.community_user
    WHERE community_id = p_community_id
    AND user_id = p_user_id
    AND role = 'community_admin'::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old policies
DROP POLICY IF EXISTS "Community owners can see all members" ON public.community_user;
DROP POLICY IF EXISTS "Community admins can see all members" ON public.community_user;

-- Create new policies using the helper functions
CREATE POLICY "Community owners can see all members" ON public.community_user 
FOR SELECT TO authenticated 
USING (
  public.is_community_owner(
    community_id, 
    ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
  )
);

CREATE POLICY "Community admins can see all members" ON public.community_user
FOR SELECT TO authenticated
USING (
  public.is_community_admin(
    community_id, 
    ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
  )
);
