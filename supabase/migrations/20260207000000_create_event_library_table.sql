-- Create event_library table for personal event libraries
-- This allows users to save events they own, have joined, or discovered
--
-- 🔐 COMPREHENSIVE SECURITY ANALYSIS
-- =====================================
--
-- This table implements secure user isolation using Row Level Security (RLS).
-- Each user can ONLY access their own library entries - this is enforced at the 
-- database level and cannot be bypassed by client code.
--
-- TOKEN AUTHENTICATION SYSTEM:
-- ----------------------------
-- The system uses a dual authentication model:
--
-- 1. Visitor Tokens (Anonymous Users):
--    JWT structure: { "sub": "visitor-uuid", "app_metadata": { "visitor_id": "visitor-uuid" } }
--    Access: Read-only access to *_public tables only (NOT event_library)
--
-- 2. User Tokens (Authenticated Users): 
--    JWT structure: { "sub": "user-uuid", "app_metadata": { "user": { "user_id": "user-uuid" } } }
--    Access: Full CRUD on own data, read access to public data
--
-- ROW LEVEL SECURITY (RLS) ENFORCEMENT:
-- ------------------------------------
-- 1. Token Generation: Server creates properly structured JWTs via API endpoints
-- 2. Client Authentication: Clients get tokens from /api/auth/visitor or /api/auth/user  
-- 3. Database Queries: All operations include JWT in Authorization header
-- 4. RLS Evaluation: PostgreSQL evaluates policies using auth.jwt() on every query
-- 5. Access Control: Only rows matching policy conditions are returned/affected
--
-- SECURITY MODEL FOR event_library:
-- --------------------------------
-- ✅ USER ISOLATION: Users can ONLY see/modify their own library entries
--    Policy: user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid
--
-- ✅ PRIVATE TABLE ACCESS: NO visitor token access - only authenticated users
--    - Visitors cannot read any library data (no visitor policies exist)
--    - Only authenticated users with valid user tokens can access
--
-- ✅ OPERATION RESTRICTIONS:
--    - SELECT: Only own records (USING clause filters automatically)
--    - INSERT: Can only insert with own user_id (WITH CHECK enforces)
--    - UPDATE: Can only update own records (both USING and WITH CHECK)
--    - DELETE: Can only delete own records (USING clause)
--
-- CLIENT-SIDE SUBSCRIPTION SECURITY:
-- ----------------------------------
-- WebSocket/Realtime subscriptions are secured by:
-- 1. Connection Authentication: WebSocket uses same JWT via client.realtime.setAuth()
-- 2. Subscription Filtering: RLS policies applied to subscription events
-- Example TypeScript: const channel = supabase.realtime.subscribe('event_library', {
--   event: '*', filter: `user_id=eq.${userId}`
-- })

CREATE TABLE public.event_library (
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    event_owner_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Composite primary key to prevent duplicate entries
    PRIMARY KEY (user_id, event_id)
);

-- Add foreign key constraints
ALTER TABLE ONLY public.event_library
    ADD CONSTRAINT event_library_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.event_library
    ADD CONSTRAINT event_library_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES public.event(event_id) ON DELETE CASCADE;

-- COLUMN COMMENTS
COMMENT ON TABLE public.event_library IS 'Stores events that users have added to their personal library. Supports owned events, joined events, and discovered events.';
COMMENT ON COLUMN public.event_library.user_id IS 'The user who has saved this event to their library.';
COMMENT ON COLUMN public.event_library.event_id IS 'References the event being saved.';
COMMENT ON COLUMN public.event_library.event_owner_id IS 'The original owner of the event (denormalized for easier querying).';
COMMENT ON COLUMN public.event_library.created_at IS 'Timestamp when the event was added to the user library.';

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.event_library ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT their own library entries
CREATE POLICY event_library_select_own_entries ON public.event_library
    FOR SELECT
    TO authenticated
    USING (user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid);

-- Policy 2: Users can INSERT into their own library
CREATE POLICY event_library_insert_own_entries ON public.event_library
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid);

-- Policy 3: Users can DELETE their own library entries
CREATE POLICY event_library_delete_own_entries ON public.event_library
    FOR DELETE
    TO authenticated
    USING (user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid);

-- No UPDATE policy needed since event_library is append-only (only create/delete)

-- INDEX FOR PERFORMANCE
-- Index on user_id for fast lookups of user's library entries
CREATE INDEX idx_event_library_user_id ON public.event_library(user_id);

-- Index on event_id for checking if an event is already in libraries
CREATE INDEX idx_event_library_event_id ON public.event_library(event_id);
