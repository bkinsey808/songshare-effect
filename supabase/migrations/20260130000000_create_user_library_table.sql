-- Create user_library table for following users
-- This creates a table mirroring the pattern used by song_library and playlist_library:
-- 1. user_library - User collections of followed users (private to the owner)
--
-- 🔐 SECURITY MODEL
-- =================
-- - user_library: Users can only access their own library entries; INSERT via API only

-- ============================================================================
-- TABLE: user_library (user collections)
-- ============================================================================

CREATE TABLE public.user_library (
    user_id uuid NOT NULL,
    followed_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Composite primary key to prevent duplicate entries
    PRIMARY KEY (user_id, followed_user_id)
);

-- Enable REPLICA IDENTITY for realtime subscriptions
ALTER TABLE ONLY public.user_library REPLICA IDENTITY FULL;

-- Foreign key constraints
ALTER TABLE ONLY public.user_library
    ADD CONSTRAINT user_library_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_library
    ADD CONSTRAINT user_library_followed_user_id_fkey
    FOREIGN KEY (followed_user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX user_library_user_id_idx ON public.user_library USING btree (user_id);
CREATE INDEX user_library_followed_user_id_idx ON public.user_library USING btree (followed_user_id);
CREATE INDEX user_library_created_at_idx ON public.user_library USING btree (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own library entries
CREATE POLICY "Users can access their own user library entries" ON public.user_library
    FOR SELECT TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- RLS Policy: Deny all INSERT operations - must go through API endpoint
CREATE POLICY "Deny all INSERT operations on user_library" ON public.user_library
    FOR INSERT TO authenticated
    WITH CHECK (false);

-- RLS Policy: Users can update their own library entries
CREATE POLICY "Users can update their own user library entries" ON public.user_library
    FOR UPDATE TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)
    WITH CHECK (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- RLS Policy: Users can delete from their own library
CREATE POLICY "Users can delete from their own user library" ON public.user_library
    FOR DELETE TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- Comments
COMMENT ON TABLE public.user_library IS 'Personal user libraries - allows users to follow other users. Realtime enabled.';
COMMENT ON COLUMN public.user_library.user_id IS 'The user who owns this library entry';
COMMENT ON COLUMN public.user_library.followed_user_id IS 'The followed user id';
COMMENT ON COLUMN public.user_library.created_at IS 'When this user was added to the library';

COMMENT ON POLICY "Deny all INSERT operations on user_library" ON public.user_library IS 'All inserts must go through the /api/user-library/add server endpoint for proper validation and authorization.';
