-- Create tag tables
--
-- tag:          global registry of all tags (slug is the identity)
-- song_tag:     tags applied to songs
-- playlist_tag: tags applied to playlists
-- event_tag:    tags applied to events
-- community_tag:tags applied to communities
-- image_tag:    tags applied to images
-- tag_library:  user's personal bookmarked tags
--
-- 🔐 SECURITY MODEL
-- =================
-- - tag:           Any authenticated user can read; INSERT/UPDATE/DELETE via API only
-- - *_tag:         Any authenticated user can read; INSERT/UPDATE/DELETE via API only
--                  Owner enforcement is handled in the API layer (not RLS), since
--                  mutations use the service role key
-- - tag_library:   Users can only read their own entries; INSERT/UPDATE/DELETE via API only

-- ============================================================================
-- TABLE: tag (global tag registry)
-- ============================================================================

CREATE TABLE public.tag (
    tag_slug text NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.tag REPLICA IDENTITY FULL;

ALTER TABLE public.tag ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.tag
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Deny all mutations on tag" ON public.tag
    TO authenticated, anon USING (false) WITH CHECK (false);

COMMENT ON TABLE public.tag IS 'Global tag registry — tags are identified by their kebab-case slug';
COMMENT ON COLUMN public.tag.tag_slug IS 'Kebab-case slug, e.g. "indie-rock". Acts as the primary key.';

-- ============================================================================
-- TABLE: song_tag
-- ============================================================================

CREATE TABLE public.song_tag (
    song_id uuid NOT NULL,
    tag_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (song_id, tag_slug)
);

ALTER TABLE ONLY public.song_tag
    ADD CONSTRAINT song_tag_song_id_fkey
    FOREIGN KEY (song_id) REFERENCES public.song_public(song_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.song_tag
    ADD CONSTRAINT song_tag_tag_slug_fkey
    FOREIGN KEY (tag_slug) REFERENCES public.tag(tag_slug) ON DELETE CASCADE;

CREATE INDEX song_tag_song_id_idx ON public.song_tag USING btree (song_id);
CREATE INDEX song_tag_tag_slug_idx ON public.song_tag USING btree (tag_slug);

ALTER TABLE ONLY public.song_tag REPLICA IDENTITY FULL;

ALTER TABLE public.song_tag ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.song_tag
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Deny all mutations on song_tag" ON public.song_tag
    TO authenticated, anon USING (false) WITH CHECK (false);

COMMENT ON TABLE public.song_tag IS 'Tags applied to songs by the song owner';

-- ============================================================================
-- TABLE: playlist_tag
-- ============================================================================

CREATE TABLE public.playlist_tag (
    playlist_id uuid NOT NULL,
    tag_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (playlist_id, tag_slug)
);

ALTER TABLE ONLY public.playlist_tag
    ADD CONSTRAINT playlist_tag_playlist_id_fkey
    FOREIGN KEY (playlist_id) REFERENCES public.playlist_public(playlist_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.playlist_tag
    ADD CONSTRAINT playlist_tag_tag_slug_fkey
    FOREIGN KEY (tag_slug) REFERENCES public.tag(tag_slug) ON DELETE CASCADE;

CREATE INDEX playlist_tag_playlist_id_idx ON public.playlist_tag USING btree (playlist_id);
CREATE INDEX playlist_tag_tag_slug_idx ON public.playlist_tag USING btree (tag_slug);

ALTER TABLE ONLY public.playlist_tag REPLICA IDENTITY FULL;

ALTER TABLE public.playlist_tag ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.playlist_tag
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Deny all mutations on playlist_tag" ON public.playlist_tag
    TO authenticated, anon USING (false) WITH CHECK (false);

COMMENT ON TABLE public.playlist_tag IS 'Tags applied to playlists by the playlist owner';

-- ============================================================================
-- TABLE: event_tag
-- ============================================================================

CREATE TABLE public.event_tag (
    event_id uuid NOT NULL,
    tag_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (event_id, tag_slug)
);

ALTER TABLE ONLY public.event_tag
    ADD CONSTRAINT event_tag_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES public.event_public(event_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.event_tag
    ADD CONSTRAINT event_tag_tag_slug_fkey
    FOREIGN KEY (tag_slug) REFERENCES public.tag(tag_slug) ON DELETE CASCADE;

CREATE INDEX event_tag_event_id_idx ON public.event_tag USING btree (event_id);
CREATE INDEX event_tag_tag_slug_idx ON public.event_tag USING btree (tag_slug);

ALTER TABLE ONLY public.event_tag REPLICA IDENTITY FULL;

ALTER TABLE public.event_tag ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.event_tag
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Deny all mutations on event_tag" ON public.event_tag
    TO authenticated, anon USING (false) WITH CHECK (false);

COMMENT ON TABLE public.event_tag IS 'Tags applied to events by the event owner';

-- ============================================================================
-- TABLE: community_tag
-- ============================================================================

CREATE TABLE public.community_tag (
    community_id uuid NOT NULL,
    tag_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (community_id, tag_slug)
);

ALTER TABLE ONLY public.community_tag
    ADD CONSTRAINT community_tag_community_id_fkey
    FOREIGN KEY (community_id) REFERENCES public.community_public(community_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.community_tag
    ADD CONSTRAINT community_tag_tag_slug_fkey
    FOREIGN KEY (tag_slug) REFERENCES public.tag(tag_slug) ON DELETE CASCADE;

CREATE INDEX community_tag_community_id_idx ON public.community_tag USING btree (community_id);
CREATE INDEX community_tag_tag_slug_idx ON public.community_tag USING btree (tag_slug);

ALTER TABLE ONLY public.community_tag REPLICA IDENTITY FULL;

ALTER TABLE public.community_tag ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.community_tag
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Deny all mutations on community_tag" ON public.community_tag
    TO authenticated, anon USING (false) WITH CHECK (false);

COMMENT ON TABLE public.community_tag IS 'Tags applied to communities by the community owner';

-- ============================================================================
-- TABLE: image_tag
-- ============================================================================

CREATE TABLE public.image_tag (
    image_id uuid NOT NULL,
    tag_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (image_id, tag_slug)
);

ALTER TABLE ONLY public.image_tag
    ADD CONSTRAINT image_tag_image_id_fkey
    FOREIGN KEY (image_id) REFERENCES public.image_public(image_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.image_tag
    ADD CONSTRAINT image_tag_tag_slug_fkey
    FOREIGN KEY (tag_slug) REFERENCES public.tag(tag_slug) ON DELETE CASCADE;

CREATE INDEX image_tag_image_id_idx ON public.image_tag USING btree (image_id);
CREATE INDEX image_tag_tag_slug_idx ON public.image_tag USING btree (tag_slug);

ALTER TABLE ONLY public.image_tag REPLICA IDENTITY FULL;

ALTER TABLE public.image_tag ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.image_tag
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Deny all mutations on image_tag" ON public.image_tag
    TO authenticated, anon USING (false) WITH CHECK (false);

COMMENT ON TABLE public.image_tag IS 'Tags applied to images by the image owner';

-- ============================================================================
-- TABLE: tag_library (user's bookmarked tags)
-- ============================================================================

CREATE TABLE public.tag_library (
    user_id uuid NOT NULL,
    tag_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, tag_slug)
);

ALTER TABLE ONLY public.tag_library
    ADD CONSTRAINT tag_library_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tag_library
    ADD CONSTRAINT tag_library_tag_slug_fkey
    FOREIGN KEY (tag_slug) REFERENCES public.tag(tag_slug) ON DELETE CASCADE;

CREATE INDEX tag_library_user_id_idx ON public.tag_library USING btree (user_id);
CREATE INDEX tag_library_tag_slug_idx ON public.tag_library USING btree (tag_slug);

ALTER TABLE ONLY public.tag_library REPLICA IDENTITY FULL;

ALTER TABLE public.tag_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for matching user_id" ON public.tag_library
    FOR SELECT TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

CREATE POLICY "Deny all mutations on tag_library" ON public.tag_library
    TO authenticated, anon USING (false) WITH CHECK (false);

COMMENT ON TABLE public.tag_library IS 'User''s personal bookmarked tags — for quick navigation and autocomplete';
COMMENT ON COLUMN public.tag_library.user_id IS 'The user who bookmarked this tag';
COMMENT ON COLUMN public.tag_library.tag_slug IS 'The bookmarked tag slug';

-- ============================================================================
-- REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.tag;
ALTER PUBLICATION supabase_realtime ADD TABLE public.song_tag;
ALTER PUBLICATION supabase_realtime ADD TABLE public.playlist_tag;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_tag;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_tag;
ALTER PUBLICATION supabase_realtime ADD TABLE public.image_tag;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tag_library;
