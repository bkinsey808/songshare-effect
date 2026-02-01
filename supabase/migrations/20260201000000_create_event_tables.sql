-- Create event tables for event functionality
-- This creates three tables following the same pattern as playlist/song:
-- 1. event - Private event data (private_notes)
-- 2. event_public - Public event data (name, slug, description, active playlist/song/slide)
-- 3. event_user - Event participants with roles (owner, admin, participant)
--
-- 🔐 SECURITY MODEL
-- =================
-- - event: Owner can read/write their own events
-- - event_public: 
--   - Public events (is_public=true): Readable by anyone (authenticated or anonymous)
--   - Private events (is_public=false): Readable only by event participants
--   - Owner can update all fields
--   - Admins can update: event_name, event_description, active_playlist_id, active_song_id, active_slide_id
-- - event_user: Users can only access their own event entries; INSERT via API only
--
-- event_slug is UNIQUE system-wide (like playlist_slug)

-- ============================================================================
-- TABLE: event (private data)
-- ============================================================================

CREATE TABLE public.event (
    event_id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    private_notes text NOT NULL DEFAULT '',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    PRIMARY KEY (event_id)
);

-- Foreign key to user
ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX event_owner_id_idx ON public.event USING btree (owner_id);

-- Enable RLS
ALTER TABLE public.event ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own events (as owner)
CREATE POLICY "Allow read for matching owner_id" ON public.event
    FOR SELECT TO authenticated
    USING (owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.event
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.event IS 'Private event data - only accessible by the event owner';
COMMENT ON COLUMN public.event.event_id IS 'Unique identifier for the event';
COMMENT ON COLUMN public.event.owner_id IS 'The user who owns this event';
COMMENT ON COLUMN public.event.private_notes IS 'Private notes visible only to the owner';

-- ============================================================================
-- TABLE: event_public (public data)
-- ============================================================================

CREATE TABLE public.event_public (
    event_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    event_name text NOT NULL,
    event_slug text NOT NULL,
    event_description text DEFAULT '',
    event_date timestamp with time zone,
    is_public boolean NOT NULL DEFAULT false,
    active_playlist_id uuid,
    active_song_id uuid,
    active_slide_id text,
    public_notes text DEFAULT '',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    PRIMARY KEY (event_id),
    
    -- Name format: 2-100 chars, trimmed, no double spaces
    CONSTRAINT event_name_format CHECK (
        (length(event_name) >= 2) AND 
        (length(event_name) <= 100) AND 
        (event_name = btrim(event_name)) AND 
        (POSITION(('  '::text) IN (event_name)) = 0)
    ),
    
    -- Slug format: lowercase alphanumeric with hyphens, no leading/trailing/double hyphens
    CONSTRAINT event_slug_format CHECK (
        (event_slug ~ '^[a-z0-9-]+$'::text) AND 
        (event_slug !~ '^-'::text) AND 
        (event_slug !~ '-$'::text) AND 
        (POSITION(('--'::text) IN (event_slug)) = 0)
    ),
    
    -- Slug must be unique system-wide
    CONSTRAINT event_slug_unique UNIQUE (event_slug)
);

-- Foreign keys
ALTER TABLE ONLY public.event_public
    ADD CONSTRAINT event_public_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES public.event(event_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.event_public
    ADD CONSTRAINT event_public_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.event_public
    ADD CONSTRAINT event_public_active_playlist_id_fkey
    FOREIGN KEY (active_playlist_id) REFERENCES public.playlist(playlist_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.event_public
    ADD CONSTRAINT event_public_active_song_id_fkey
    FOREIGN KEY (active_song_id) REFERENCES public.song(song_id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX event_public_event_slug_idx ON public.event_public USING btree (event_slug);
CREATE INDEX event_public_owner_id_idx ON public.event_public USING btree (owner_id);
CREATE INDEX event_public_is_public_idx ON public.event_public USING btree (is_public);
CREATE INDEX event_public_active_playlist_id_idx ON public.event_public USING btree (active_playlist_id);
CREATE INDEX event_public_active_song_id_idx ON public.event_public USING btree (active_song_id);
CREATE INDEX event_public_event_date_idx ON public.event_public USING btree (event_date DESC);

-- Enable RLS
ALTER TABLE public.event_public ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public events readable by anyone (authenticated or anonymous)
CREATE POLICY "Allow read access to public events for anyone" ON public.event_public
    FOR SELECT
    USING (is_public = true);

-- RLS Policy: Private events readable only by participants
CREATE POLICY "Allow read access to private events for participants" ON public.event_public
    FOR SELECT TO authenticated
    USING (
        is_public = false AND
        EXISTS (
            SELECT 1 FROM public.event_user
            WHERE event_user.event_id = event_public.event_id
            AND event_user.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
        )
    );

-- RLS Policy: Owner can update all fields
CREATE POLICY "Allow owner to update all fields" ON public.event_public
    FOR UPDATE TO authenticated
    USING (owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)
    WITH CHECK (owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- RLS Policy: Admins can update specific fields only
-- Note: This policy allows admins to update, but the API will enforce field restrictions
CREATE POLICY "Allow admins to update event fields" ON public.event_public
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.event_user
            WHERE event_user.event_id = event_public.event_id
            AND event_user.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
            AND event_user.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.event_user
            WHERE event_user.event_id = event_public.event_id
            AND event_user.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
            AND event_user.role = 'admin'
        )
    );

-- Trigger for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.event_public
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.event_public IS 'Public event data - readable based on is_public flag and participant status';
COMMENT ON COLUMN public.event_public.event_id IS 'Reference to the parent event record';
COMMENT ON COLUMN public.event_public.owner_id IS 'The user who owns this event';
COMMENT ON COLUMN public.event_public.event_name IS 'Display name of the event';
COMMENT ON COLUMN public.event_public.event_slug IS 'URL-friendly identifier, unique system-wide';
COMMENT ON COLUMN public.event_public.event_description IS 'Description of the event';
COMMENT ON COLUMN public.event_public.event_date IS 'Date and time of the event';
COMMENT ON COLUMN public.event_public.is_public IS 'Whether the event is publicly viewable (including anonymous users)';
COMMENT ON COLUMN public.event_public.active_playlist_id IS 'Currently active playlist for this event';
COMMENT ON COLUMN public.event_public.active_song_id IS 'Currently active song within the active playlist';
COMMENT ON COLUMN public.event_public.active_slide_id IS 'Currently active slide within the active song';
COMMENT ON COLUMN public.event_public.public_notes IS 'Public notes visible to all event viewers';

-- ============================================================================
-- TABLE: event_user (participant management)
-- ============================================================================

CREATE TABLE public.event_user (
    event_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Composite primary key to prevent duplicate entries
    PRIMARY KEY (event_id, user_id),
    
    -- Role must be one of: owner, admin, participant
    CONSTRAINT event_user_role_check CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'participant'::text]))
);

-- Enable REPLICA IDENTITY for realtime subscriptions
ALTER TABLE ONLY public.event_user REPLICA IDENTITY FULL;

-- Foreign key constraints
ALTER TABLE ONLY public.event_user
    ADD CONSTRAINT event_user_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES public.event(event_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.event_user
    ADD CONSTRAINT event_user_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX event_user_event_id_idx ON public.event_user USING btree (event_id);
CREATE INDEX event_user_user_id_idx ON public.event_user USING btree (user_id);
CREATE INDEX event_user_role_idx ON public.event_user USING btree (role);
CREATE INDEX event_user_joined_at_idx ON public.event_user USING btree (joined_at DESC);

-- Enable Row Level Security
ALTER TABLE public.event_user ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access event_user entries for events they're part of
CREATE POLICY "Users can access their own event entries" ON public.event_user
    FOR SELECT TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- RLS Policy: Deny all INSERT operations - must go through API endpoint
CREATE POLICY "Deny all INSERT operations on event_user" ON public.event_user
    FOR INSERT TO authenticated
    WITH CHECK (false);

-- RLS Policy: Users can update their own event entries (for future use)
CREATE POLICY "Users can update their own event entries" ON public.event_user
    FOR UPDATE TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)
    WITH CHECK (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- RLS Policy: Users can delete their own entries (leave event)
CREATE POLICY "Users can delete their own event entries" ON public.event_user
    FOR DELETE TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- Comments
COMMENT ON TABLE public.event_user IS 'Event participants with roles - manages who can access and modify events. Realtime enabled.';
COMMENT ON COLUMN public.event_user.event_id IS 'Reference to the event';
COMMENT ON COLUMN public.event_user.user_id IS 'Reference to the user';
COMMENT ON COLUMN public.event_user.role IS 'User role in this event: owner, admin, or participant';
COMMENT ON COLUMN public.event_user.joined_at IS 'When this user joined the event';

COMMENT ON POLICY "Deny all INSERT operations on event_user" ON public.event_user IS 'All inserts must go through the /api/event-user/add server endpoint for proper validation and authorization.';
