-- Create a function to log JWT for debugging
CREATE OR REPLACE FUNCTION debug_jwt()
RETURNS TABLE(jwt_text text, user_text text, user_id_text text) AS $$
BEGIN
  RETURN QUERY SELECT 
    auth.jwt()::text,
    (auth.jwt() -> 'user')::text,
    ((auth.jwt() -> 'user' ->> 'user_id'))::text;
END;
$$ LANGUAGE plpgsql;

-- Create a simple test policy that allows owners to read using a simpler condition
-- This will help us understand if the JWT path is the issue
DROP POLICY IF EXISTS "Test owner read" ON public.event_public;

CREATE POLICY "Test owner read"
ON public.event_public
FOR SELECT
TO authenticated
USING (
  -- Log the comparison or try a simpler approach
  CASE 
    WHEN auth.jwt() IS NULL THEN false
    WHEN (auth.jwt() -> 'user') IS NULL THEN false
    ELSE owner_id = ((auth.jwt() -> 'user' ->> 'user_id')::uuid)
  END
);
