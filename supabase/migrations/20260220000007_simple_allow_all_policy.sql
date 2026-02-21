-- Re-enable RLS and create a simple "allow all authenticated" policy
-- This will test if RLS being completely disabled was the issue

ALTER TABLE public.event_public ENABLE ROW LEVEL SECURITY;

-- Drop the old permissive policy
DROP POLICY IF EXISTS "Allow owner to read own event_public" ON public.event_public;

-- Create a simple allow-all authenticated policy for testing
CREATE POLICY "Allow authenticated users to read event_public"
ON public.event_public
FOR SELECT
TO authenticated
USING (TRUE);

COMMENT ON POLICY "Allow authenticated users to read event_public" ON public.event_public IS
  'Test policy: Allow all authenticated users to read all event_public rows (temporary for debugging).';
