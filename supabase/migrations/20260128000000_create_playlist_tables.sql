-- Create playlist tables for playlist functionality
-- This creates three tables following the same pattern as song/song_public/song_library:
-- 1. playlist - Private playlist data (private_notes)
-- 2. playlist_public - Public playlist data (name, slug, song_order, public_notes)
-- 3. playlist_library - User collections of playlists (own or others')
--
-- 🔐 SECURITY MODEL
-- =================
-- - playlist: Owner can read/write their own playlists
-- - playlist_public: Anyone authenticated (visitors or users) can read; owner can write
-- - playlist_library: Users can only access their own library entries; INSERT via API only
--
-- playlist_slug is UNIQUE system-wide (not per-user like song_slug)

-- ============================================================================
-- TABLE: playlist (private data)
-- ============================================================================

CREATE TABLE public.playlist (
    playlist_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    private_notes text NOT NULL DEFAULT '',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    PRIMARY KEY (playlist_id)
);

-- Foreign key to user
ALTER TABLE ONLY public.playlist
    ADD CONSTRAINT playlist_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX playlist_user_id_idx ON public.playlist USING btree (user_id);

-- Enable RLS
ALTER TABLE public.playlist ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own playlists
CREATE POLICY "Allow read for matching user_id" ON public.playlist
    FOR SELECT TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.playlist
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.playlist IS 'Private playlist data - only accessible by the playlist owner';
COMMENT ON COLUMN public.playlist.playlist_id IS 'Unique identifier for the playlist';
COMMENT ON COLUMN public.playlist.user_id IS 'The user who owns this playlist';
COMMENT ON COLUMN public.playlist.private_notes IS 'Private notes visible only to the owner';

-- ============================================================================
-- TABLE: playlist_public (public data)
-- ============================================================================

CREATE TABLE public.playlist_public (
    playlist_id uuid NOT NULL,
    user_id uuid NOT NULL,
    playlist_name text NOT NULL,
    playlist_slug text NOT NULL,
    public_notes text DEFAULT '',
    song_order uuid[] NOT NULL DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    PRIMARY KEY (playlist_id),
    
    -- Name format: 2-100 chars, trimmed, no double spaces
    CONSTRAINT playlist_name_format CHECK (
        (length(playlist_name) >= 2) AND 
        (length(playlist_name) <= 100) AND 
        (playlist_name = btrim(playlist_name)) AND 
        (POSITION(('  '::text) IN (playlist_name)) = 0)
    ),
    
    -- Slug format: lowercase alphanumeric with hyphens, no leading/trailing/double hyphens
    CONSTRAINT playlist_slug_format CHECK (
        (playlist_slug ~ '^[a-z0-9-]+$'::text) AND 
        (playlist_slug !~ '^-'::text) AND 
        (playlist_slug !~ '-$'::text) AND 
        (POSITION(('--'::text) IN (playlist_slug)) = 0)
    ),
    
    -- Slug must be unique system-wide
    CONSTRAINT playlist_slug_unique UNIQUE (playlist_slug)
);

-- Foreign keys
ALTER TABLE ONLY public.playlist_public
    ADD CONSTRAINT playlist_public_playlist_id_fkey
    FOREIGN KEY (playlist_id) REFERENCES public.playlist(playlist_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.playlist_public
    ADD CONSTRAINT playlist_public_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX playlist_public_playlist_slug_idx ON public.playlist_public USING btree (playlist_slug);
CREATE INDEX playlist_public_user_id_idx ON public.playlist_public USING btree (user_id);

-- Enable RLS
ALTER TABLE public.playlist_public ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone authenticated (visitors or users) can read public playlist data
CREATE POLICY "Allow read access to playlist_public for visitors or users" ON public.playlist_public
    FOR SELECT TO authenticated
    USING (
        ((((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL) OR 
        ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL))
    );

-- Trigger for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.playlist_public
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.playlist_public IS 'Public playlist data - readable by anyone authenticated, writable by owner';
COMMENT ON COLUMN public.playlist_public.playlist_id IS 'Reference to the parent playlist record';
COMMENT ON COLUMN public.playlist_public.user_id IS 'The user who owns this playlist';
COMMENT ON COLUMN public.playlist_public.playlist_name IS 'Display name of the playlist';
COMMENT ON COLUMN public.playlist_public.playlist_slug IS 'URL-friendly identifier, unique system-wide';
COMMENT ON COLUMN public.playlist_public.public_notes IS 'Public notes visible to everyone';
COMMENT ON COLUMN public.playlist_public.song_order IS 'Ordered array of song_ids in this playlist';

-- ============================================================================
-- TABLE: playlist_library (user collections)
-- ============================================================================

CREATE TABLE public.playlist_library (
    user_id uuid NOT NULL,
    playlist_id uuid NOT NULL,
    playlist_owner_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Composite primary key to prevent duplicate entries
    PRIMARY KEY (user_id, playlist_id)
);

-- Enable REPLICA IDENTITY for realtime subscriptions
ALTER TABLE ONLY public.playlist_library REPLICA IDENTITY FULL;

-- Foreign key constraints
ALTER TABLE ONLY public.playlist_library
    ADD CONSTRAINT playlist_library_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.playlist_library
    ADD CONSTRAINT playlist_library_playlist_id_fkey
    FOREIGN KEY (playlist_id) REFERENCES public.playlist(playlist_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.playlist_library
    ADD CONSTRAINT playlist_library_playlist_owner_id_fkey
    FOREIGN KEY (playlist_owner_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX playlist_library_user_id_idx ON public.playlist_library USING btree (user_id);
CREATE INDEX playlist_library_playlist_id_idx ON public.playlist_library USING btree (playlist_id);
CREATE INDEX playlist_library_playlist_owner_id_idx ON public.playlist_library USING btree (playlist_owner_id);
CREATE INDEX playlist_library_created_at_idx ON public.playlist_library USING btree (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.playlist_library ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own library entries
CREATE POLICY "Users can access their own playlist library entries" ON public.playlist_library
    FOR SELECT TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- RLS Policy: Deny all INSERT operations - must go through API endpoint
CREATE POLICY "Deny all INSERT operations on playlist_library" ON public.playlist_library
    FOR INSERT TO authenticated
    WITH CHECK (false);

-- RLS Policy: Users can update their own library entries
CREATE POLICY "Users can update their own playlist library entries" ON public.playlist_library
    FOR UPDATE TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)
    WITH CHECK (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- RLS Policy: Users can delete from their own library
CREATE POLICY "Users can delete from their own playlist library" ON public.playlist_library
    FOR DELETE TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

-- Comments
COMMENT ON TABLE public.playlist_library IS 'Personal playlist libraries - allows users to collect playlists (their own or others'') into their personal library. Realtime enabled.';
COMMENT ON COLUMN public.playlist_library.user_id IS 'The user who owns this library entry';
COMMENT ON COLUMN public.playlist_library.playlist_id IS 'Reference to the playlist being added to library';
COMMENT ON COLUMN public.playlist_library.playlist_owner_id IS 'The original owner/creator of the playlist';
COMMENT ON COLUMN public.playlist_library.created_at IS 'When this playlist was added to the user''s library';

COMMENT ON POLICY "Deny all INSERT operations on playlist_library" ON public.playlist_library IS 'All inserts must go through the /api/playlist-library/add server endpoint for proper validation and authorization.';
