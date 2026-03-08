-- Re-enable RLS on tables where it was temporarily disabled for debugging.
-- This prevents users from seeing other people's data (like pending invitations)
-- and ensures the security model is correctly enforced.

ALTER TABLE public.community_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_public ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.community_user IS 'RLS re-enabled after fixing invitation fetch logic.';
COMMENT ON TABLE public.event_public IS 'RLS re-enabled after fixing invitation fetch logic.';
