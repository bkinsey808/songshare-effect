-- Create community_library table for personal community libraries
-- This allows users to save communities they own, have joined, or discovered
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
--    Access: Read-only access to *_public tables only (NOT community_library)
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
-- SECURITY MODEL FOR community_library:
-- -------------------------------------
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
--    - UPDATE: No UPDATE policy - table is append-only (create/delete only)
--    - DELETE: Can only delete own records (USING clause)
--
-- CLIENT-SIDE SUBSCRIPTION SECURITY:
-- ----------------------------------
-- WebSocket/Realtime subscriptions are secured by:
-- 1. Connection Authentication: WebSocket uses same JWT via client.realtime.setAuth()
-- 2. Subscription Filtering: RLS policies applied to subscription events

CREATE TABLE public.community_library (
    user_id uuid NOT NULL,
    community_id uuid NOT NULL,
    community_owner_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Composite primary key to prevent duplicate entries
    PRIMARY KEY (user_id, community_id)
);

ALTER TABLE ONLY public.community_library REPLICA IDENTITY FULL;

-- Add foreign key constraints
ALTER TABLE ONLY public.community_library
    ADD CONSTRAINT community_library_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.community_library
    ADD CONSTRAINT community_library_community_id_fkey
    FOREIGN KEY (community_id) REFERENCES public.community(community_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.community_library
    ADD CONSTRAINT community_library_community_owner_id_fkey
    FOREIGN KEY (community_owner_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

-- FK to community_public enables PostgREST to join community_library with community_public
ALTER TABLE ONLY public.community_library
    ADD CONSTRAINT community_library_community_public_fkey
    FOREIGN KEY (community_id) REFERENCES public.community_public(community_id) ON DELETE CASCADE;

-- COLUMN COMMENTS
COMMENT ON TABLE public.community_library IS 'Stores communities that users have added to their personal library. Supports owned communities, joined communities, and discovered communities.';
COMMENT ON COLUMN public.community_library.user_id IS 'The user who has saved this community to their library.';
COMMENT ON COLUMN public.community_library.community_id IS 'References the community being saved.';
COMMENT ON COLUMN public.community_library.community_owner_id IS 'The original owner of the community (denormalized for easier querying).';
COMMENT ON COLUMN public.community_library.created_at IS 'Timestamp when the community was added to the user library.';

COMMENT ON CONSTRAINT community_library_community_owner_id_fkey ON public.community_library IS 'Ensures community_owner_id references a valid user. Cascades deletion if the owner is deleted.';
COMMENT ON CONSTRAINT community_library_community_public_fkey ON public.community_library IS 'Enables PostgREST to join community_library with community_public for fetching community data.';

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.community_library ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT their own library entries
CREATE POLICY community_library_select_own_entries ON public.community_library
    FOR SELECT
    TO authenticated
    USING (user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid);

-- Policy 2: Users can INSERT into their own library
CREATE POLICY community_library_insert_own_entries ON public.community_library
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid);

-- Policy 3: Users can DELETE their own library entries
CREATE POLICY community_library_delete_own_entries ON public.community_library
    FOR DELETE
    TO authenticated
    USING (user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid);

-- No UPDATE policy needed since community_library is append-only (only create/delete)

-- INDEX FOR PERFORMANCE
-- Index on user_id for fast lookups of user's library entries
CREATE INDEX idx_community_library_user_id ON public.community_library(user_id);

-- Index on community_id for checking if a community is already in libraries
CREATE INDEX idx_community_library_community_id ON public.community_library(community_id);
