-- Temporarily disable RLS on event_public entirely to test if RLS is blocking realtime
ALTER TABLE public.event_public DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.event_public IS 'RLS temporarily disabled for debugging realtime issues.';
