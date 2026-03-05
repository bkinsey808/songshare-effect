-- Create sharing system tables for user-to-user item sharing
-- This creates tables following the established public/private pattern:
-- 1. share - Private share data (sender only)
-- 2. share_public - Public share data (sender and recipient)
-- 3. share_library - Share collections (recipient's library)
--
-- 🔐 SECURITY MODEL
-- =================
-- - share: Only sender can read their private data; INSERT/UPDATE/DELETE via API only
-- - share_public: Both sender and recipient can read; INSERT/UPDATE/DELETE via API only
-- - share_library: Users can only access their own library entries; INSERT/UPDATE/DELETE via API only

-- ============================================================================
-- TABLE: share (private share data)
-- ============================================================================

CREATE TABLE public.share (
    share_id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    sender_user_id uuid NOT NULL,
    private_notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Foreign key constraints
ALTER TABLE ONLY public.share
    ADD CONSTRAINT share_sender_user_id_fkey
    FOREIGN KEY (sender_user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX share_sender_user_id_idx ON public.share USING btree (sender_user_id);

-- Enable Row Level Security
ALTER TABLE public.share ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only sender can read their private data
CREATE POLICY "Allow read for matching sender_user_id" ON public.share
    FOR SELECT TO authenticated
    USING (sender_user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- RLS Policy: Deny all mutations - must go through API endpoints
CREATE POLICY "Deny all mutations on share" ON public.share
    TO authenticated, anon USING (false) WITH CHECK (false);

-- Comments
COMMENT ON TABLE public.share IS 'Private share data - only accessible by the share sender';
COMMENT ON COLUMN public.share.share_id IS 'Unique identifier for the share';
COMMENT ON COLUMN public.share.sender_user_id IS 'The user who created this share';
COMMENT ON COLUMN public.share.private_notes IS 'Private notes visible only to the sender';

COMMENT ON POLICY "Deny all mutations on share" ON public.share IS 'All share mutations must go through the API server for proper validation and authorization.';

-- ============================================================================
-- TABLE: share_public (public share data)
-- ============================================================================

CREATE TABLE public.share_public (
    share_id uuid NOT NULL PRIMARY KEY,
    sender_user_id uuid NOT NULL,
    recipient_user_id uuid NOT NULL,
    shared_item_type text NOT NULL CHECK (shared_item_type = ANY (ARRAY['song'::text, 'playlist'::text, 'event'::text, 'community'::text, 'user'::text])),
    shared_item_id uuid NOT NULL,
    shared_item_name text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
    message text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
    
    -- Note: We'll enforce referential integrity at the application level
    -- PostgreSQL doesn't support conditional foreign keys or subqueries in CHECK constraints
    -- The API will validate that shared_item_id exists in the appropriate table based on shared_item_type
);

-- Enable REPLICA IDENTITY for realtime subscriptions
ALTER TABLE ONLY public.share_public REPLICA IDENTITY FULL;

-- Foreign key constraints
ALTER TABLE ONLY public.share_public
    ADD CONSTRAINT share_public_share_id_fkey
    FOREIGN KEY (share_id) REFERENCES public.share(share_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.share_public
    ADD CONSTRAINT share_public_sender_user_id_fkey
    FOREIGN KEY (sender_user_id) REFERENCES public.user_public(user_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.share_public
    ADD CONSTRAINT share_public_recipient_user_id_fkey
    FOREIGN KEY (recipient_user_id) REFERENCES public.user_public(user_id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX share_public_sender_user_id_idx ON public.share_public USING btree (sender_user_id);
CREATE INDEX share_public_recipient_user_id_idx ON public.share_public USING btree (recipient_user_id);
CREATE INDEX share_public_status_idx ON public.share_public USING btree (status);
CREATE INDEX share_public_shared_item_type_idx ON public.share_public USING btree (shared_item_type);
CREATE INDEX share_public_created_at_idx ON public.share_public USING btree (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.share_public ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Both sender and recipient can read
CREATE POLICY "Allow read access to share_public for sender and recipient" ON public.share_public
    FOR SELECT TO authenticated
    USING (
        sender_user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid OR
        recipient_user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
    );

-- RLS Policy: Deny all mutations - must go through API endpoints
CREATE POLICY "Deny all mutations on share_public" ON public.share_public
    TO authenticated, anon USING (false) WITH CHECK (false);

-- Comments
COMMENT ON TABLE public.share_public IS 'Public share data - readable by sender and recipient, writable via API only';
COMMENT ON COLUMN public.share_public.share_id IS 'Reference to the parent share record';
COMMENT ON COLUMN public.share_public.sender_user_id IS 'The user who created this share';
COMMENT ON COLUMN public.share_public.recipient_user_id IS 'The user who received this share';
COMMENT ON COLUMN public.share_public.shared_item_type IS 'Type of item being shared: song, playlist, event, community, or user';
COMMENT ON COLUMN public.share_public.shared_item_id IS 'ID of the item being shared';
COMMENT ON COLUMN public.share_public.shared_item_name IS 'Display name of the shared item';
COMMENT ON COLUMN public.share_public.status IS 'Share status: pending, accepted, or rejected';
COMMENT ON COLUMN public.share_public.message IS 'Optional message from sender to recipient';

COMMENT ON POLICY "Deny all mutations on share_public" ON public.share_public IS 'All share mutations must go through the API server for proper validation and authorization.';

-- ============================================================================
-- TABLE: share_library (share collections)
-- ============================================================================

CREATE TABLE public.share_library (
    user_id uuid NOT NULL,
    share_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Composite primary key to prevent duplicate entries
    PRIMARY KEY (user_id, share_id)
);

-- Enable REPLICA IDENTITY for realtime subscriptions
ALTER TABLE ONLY public.share_library REPLICA IDENTITY FULL;

-- Foreign key constraints
ALTER TABLE ONLY public.share_library
    ADD CONSTRAINT share_library_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.share_library
    ADD CONSTRAINT share_library_share_id_fkey
    FOREIGN KEY (share_id) REFERENCES public.share(share_id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX share_library_user_id_idx ON public.share_library USING btree (user_id);
CREATE INDEX share_library_share_id_idx ON public.share_library USING btree (share_id);
CREATE INDEX share_library_created_at_idx ON public.share_library USING btree (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.share_library ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own library entries
CREATE POLICY "Users can access their own share library entries" ON public.share_library
    FOR SELECT TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- RLS Policy: Deny all INSERT operations - must go through API endpoint
CREATE POLICY "Deny all INSERT operations on share_library" ON public.share_library
    FOR INSERT TO authenticated
    WITH CHECK (false);

-- RLS Policy: Users can update their own library entries
CREATE POLICY "Users can update their own share library entries" ON public.share_library
    FOR UPDATE TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)
    WITH CHECK (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- RLS Policy: Users can delete from their own library
CREATE POLICY "Users can delete from their own share library" ON public.share_library
    FOR DELETE TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- Comments
COMMENT ON TABLE public.share_library IS 'Personal share libraries - allows users to organize received shares. Realtime enabled.';
COMMENT ON COLUMN public.share_library.user_id IS 'The user who owns this library entry';
COMMENT ON COLUMN public.share_library.share_id IS 'Reference to the share being added to library';
COMMENT ON COLUMN public.share_library.created_at IS 'When this share was added to the user library';

COMMENT ON POLICY "Deny all INSERT operations on share_library" ON public.share_library IS 'All inserts must go through the /api/shares/create server endpoint for proper validation and authorization.';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Add updated_at triggers for timestamp management
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.share FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.share_public FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();