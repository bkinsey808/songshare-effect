--
-- PostgreSQL database dump
--

\restrict txwI0GV3tzKUPaYDUUsrZhECBf1OCYYxZ6PFm0NePuw3r7P6GVQnmuetFGS7iLb

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.7 (Ubuntu 17.7-3.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: playlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playlist (
    playlist_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    private_notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE playlist; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.playlist IS 'Private playlist data - only accessible by the playlist owner';


--
-- Name: COLUMN playlist.playlist_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.playlist.playlist_id IS 'Unique identifier for the playlist';


--
-- Name: COLUMN playlist.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.playlist.user_id IS 'The user who owns this playlist';


--
-- Name: COLUMN playlist.private_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.playlist.private_notes IS 'Private notes visible only to the owner';


--
-- Name: playlist_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playlist_library (
    user_id uuid NOT NULL,
    playlist_id uuid NOT NULL,
    playlist_owner_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.playlist_library REPLICA IDENTITY FULL;


--
-- Name: TABLE playlist_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.playlist_library IS 'Personal playlist libraries - allows users to collect playlists (their own or others'') into their personal library. Realtime enabled.';


--
-- Name: COLUMN playlist_library.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.playlist_library.user_id IS 'The user who owns this library entry';


--
-- Name: COLUMN playlist_library.playlist_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.playlist_library.playlist_id IS 'Reference to the playlist being added to library';


--
-- Name: COLUMN playlist_library.playlist_owner_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.playlist_library.playlist_owner_id IS 'The original owner/creator of the playlist';


--
-- Name: COLUMN playlist_library.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.playlist_library.created_at IS 'When this playlist was added to the user''s library';


--
-- Name: playlist_public; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playlist_public (
    playlist_id uuid NOT NULL,
    user_id uuid NOT NULL,
    playlist_name text NOT NULL,
    playlist_slug text NOT NULL,
    public_notes text DEFAULT ''::text,
    song_order uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT playlist_name_format CHECK (((length(playlist_name) >= 2) AND (length(playlist_name) <= 100) AND (playlist_name = btrim(playlist_name)) AND (POSITION(('  '::text) IN (playlist_name)) = 0))),
    CONSTRAINT playlist_slug_format CHECK (((playlist_slug ~ '^[a-z0-9-]+$'::text) AND (playlist_slug !~ '^-'::text) AND (playlist_slug !~ '-$'::text) AND (POSITION(('--'::text) IN (playlist_slug)) = 0)))
);

ALTER TABLE ONLY public.playlist_public REPLICA IDENTITY FULL;


--
-- Name: TABLE playlist_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.playlist_public IS 'Public playlist data - readable by anyone authenticated, writable by owner';


--
-- Name: COLUMN playlist_public.playlist_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.playlist_public.playlist_id IS 'Reference to the parent playlist record';


--
-- Name: COLUMN playlist_public.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.playlist_public.user_id IS 'The user who owns this playlist';


--
-- Name: COLUMN playlist_public.playlist_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.playlist_public.playlist_name IS 'Display name of the playlist';


--
-- Name: COLUMN playlist_public.playlist_slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.playlist_public.playlist_slug IS 'URL-friendly identifier, unique system-wide';


--
-- Name: COLUMN playlist_public.public_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.playlist_public.public_notes IS 'Public notes visible to everyone';


--
-- Name: COLUMN playlist_public.song_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.playlist_public.song_order IS 'Ordered array of song_ids in this playlist';


--
-- Name: song; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.song (
    song_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    private_notes text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: song_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.song_library (
    user_id uuid NOT NULL,
    song_id uuid NOT NULL,
    song_owner_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.song_library REPLICA IDENTITY FULL;


--
-- Name: TABLE song_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.song_library IS 'Personal song libraries - allows users to collect songs (their own or others'') into their personal library. Realtime enabled.';


--
-- Name: COLUMN song_library.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.song_library.user_id IS 'The user who owns this library entry';


--
-- Name: COLUMN song_library.song_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.song_library.song_id IS 'Reference to the song being added to library';


--
-- Name: COLUMN song_library.song_owner_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.song_library.song_owner_id IS 'The original owner/creator of the song';


--
-- Name: COLUMN song_library.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.song_library.created_at IS 'When this song was added to the user''s library';


--
-- Name: song_public; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.song_public (
    song_id uuid NOT NULL,
    user_id uuid NOT NULL,
    song_name text NOT NULL,
    song_slug text NOT NULL,
    fields text[] NOT NULL,
    slide_order text[] NOT NULL,
    slides jsonb NOT NULL,
    key text,
    scale text,
    short_credit text,
    long_credit text,
    public_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT song_name_format CHECK (((length(song_name) >= 2) AND (length(song_name) <= 100) AND (song_name = btrim(song_name)) AND (POSITION(('  '::text) IN (song_name)) = 0))),
    CONSTRAINT song_slug_format CHECK (((song_slug ~ '^[a-z0-9-]+$'::text) AND (song_slug !~ '-%'::text) AND (song_slug !~ '%-'::text) AND (POSITION(('--'::text) IN (song_slug)) = 0)))
);

ALTER TABLE ONLY public.song_public REPLICA IDENTITY FULL;


--
-- Name: TABLE song_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.song_public IS 'Public song metadata. Realtime enabled for metadata updates.';


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    sub text,
    email text NOT NULL,
    google_calendar_access text DEFAULT 'none'::text NOT NULL,
    google_calendar_refresh_token text,
    role text DEFAULT 'free'::text NOT NULL,
    role_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    linked_providers text[],
    CONSTRAINT user_role_check CHECK ((role = ANY (ARRAY['free'::text, 'patron'::text, 'admin'::text])))
);


--
-- Name: user_public; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_public (
    user_id uuid NOT NULL,
    username text NOT NULL
);

ALTER TABLE ONLY public.user_public REPLICA IDENTITY FULL;


--
-- Name: playlist_library playlist_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_library
    ADD CONSTRAINT playlist_library_pkey PRIMARY KEY (user_id, playlist_id);


--
-- Name: playlist playlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist
    ADD CONSTRAINT playlist_pkey PRIMARY KEY (playlist_id);


--
-- Name: playlist_public playlist_public_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_public
    ADD CONSTRAINT playlist_public_pkey PRIMARY KEY (playlist_id);


--
-- Name: playlist_public playlist_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_public
    ADD CONSTRAINT playlist_slug_unique UNIQUE (playlist_slug);


--
-- Name: song_library song_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_library
    ADD CONSTRAINT song_library_pkey PRIMARY KEY (user_id, song_id);


--
-- Name: song song_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song
    ADD CONSTRAINT song_pkey PRIMARY KEY (song_id);


--
-- Name: song_public song_public_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_public
    ADD CONSTRAINT song_public_pkey PRIMARY KEY (song_id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (user_id);


--
-- Name: user_public user_public_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_public
    ADD CONSTRAINT user_public_pkey PRIMARY KEY (user_id);


--
-- Name: user_public user_public_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_public
    ADD CONSTRAINT user_public_username_key UNIQUE (username);


--
-- Name: idx_user_public_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_public_username ON public.user_public USING btree (username);


--
-- Name: playlist_library_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlist_library_created_at_idx ON public.playlist_library USING btree (created_at DESC);


--
-- Name: playlist_library_playlist_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlist_library_playlist_id_idx ON public.playlist_library USING btree (playlist_id);


--
-- Name: playlist_library_playlist_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlist_library_playlist_owner_id_idx ON public.playlist_library USING btree (playlist_owner_id);


--
-- Name: playlist_library_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlist_library_user_id_idx ON public.playlist_library USING btree (user_id);


--
-- Name: playlist_public_playlist_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlist_public_playlist_slug_idx ON public.playlist_public USING btree (playlist_slug);


--
-- Name: playlist_public_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlist_public_user_id_idx ON public.playlist_public USING btree (user_id);


--
-- Name: playlist_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlist_user_id_idx ON public.playlist USING btree (user_id);


--
-- Name: song_library_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX song_library_created_at_idx ON public.song_library USING btree (created_at DESC);


--
-- Name: song_library_song_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX song_library_song_id_idx ON public.song_library USING btree (song_id);


--
-- Name: song_library_song_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX song_library_song_owner_id_idx ON public.song_library USING btree (song_owner_id);


--
-- Name: song_library_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX song_library_user_id_idx ON public.song_library USING btree (user_id);


--
-- Name: song_public_song_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX song_public_song_slug_idx ON public.song_public USING btree (song_slug);


--
-- Name: user_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_email_idx ON public."user" USING btree (email);


--
-- Name: playlist set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.playlist FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: playlist_public set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.playlist_public FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: song set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.song FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: song_public set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.song_public FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public."user" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: playlist_library playlist_library_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_library
    ADD CONSTRAINT playlist_library_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlist(playlist_id) ON DELETE CASCADE;


--
-- Name: playlist_library playlist_library_playlist_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_library
    ADD CONSTRAINT playlist_library_playlist_owner_id_fkey FOREIGN KEY (playlist_owner_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: playlist_library playlist_library_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_library
    ADD CONSTRAINT playlist_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: playlist_public playlist_public_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_public
    ADD CONSTRAINT playlist_public_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlist(playlist_id) ON DELETE CASCADE;


--
-- Name: playlist_public playlist_public_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_public
    ADD CONSTRAINT playlist_public_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: playlist playlist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist
    ADD CONSTRAINT playlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: song_library song_library_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_library
    ADD CONSTRAINT song_library_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.song(song_id) ON DELETE CASCADE;


--
-- Name: song_library song_library_song_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_library
    ADD CONSTRAINT song_library_song_owner_id_fkey FOREIGN KEY (song_owner_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: song_library song_library_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_library
    ADD CONSTRAINT song_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: song_public song_public_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_public
    ADD CONSTRAINT song_public_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.song(song_id) ON DELETE CASCADE;


--
-- Name: song_public song_public_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_public
    ADD CONSTRAINT song_public_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: song song_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song
    ADD CONSTRAINT song_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: user_public user_public_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_public
    ADD CONSTRAINT user_public_userid_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: playlist_public Allow read access to playlist_public for visitors or users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to playlist_public for visitors or users" ON public.playlist_public FOR SELECT TO authenticated USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL) OR ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)));


--
-- Name: song_public Allow read access to song_public for visitors or users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to song_public for visitors or users" ON public.song_public FOR SELECT TO authenticated USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL) OR ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)));


--
-- Name: user_public Allow read access to user_public for visitors or users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to user_public for visitors or users" ON public.user_public FOR SELECT TO authenticated USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL) OR ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)));


--
-- Name: playlist Allow read for matching user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for matching user_id" ON public.playlist FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: song Allow read for matching user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for matching user_id" ON public.song FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: playlist_library Deny all INSERT operations on playlist_library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all INSERT operations on playlist_library" ON public.playlist_library FOR INSERT TO authenticated WITH CHECK (false);


--
-- Name: POLICY "Deny all INSERT operations on playlist_library" ON playlist_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Deny all INSERT operations on playlist_library" ON public.playlist_library IS 'All inserts must go through the /api/playlist-library/add server endpoint for proper validation and authorization.';


--
-- Name: song_library Deny all INSERT operations on song_library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all INSERT operations on song_library" ON public.song_library FOR INSERT TO authenticated WITH CHECK (false);


--
-- Name: POLICY "Deny all INSERT operations on song_library" ON song_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Deny all INSERT operations on song_library" ON public.song_library IS 'All inserts must go through the /api/song-library/add server endpoint for proper validation and authorization.';


--
-- Name: song_library Users can access their own library entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can access their own library entries" ON public.song_library FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: playlist_library Users can access their own playlist library entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can access their own playlist library entries" ON public.playlist_library FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: song_library Users can delete from their own library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete from their own library" ON public.song_library FOR DELETE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: playlist_library Users can delete from their own playlist library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete from their own playlist library" ON public.playlist_library FOR DELETE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: song_library Users can update their own library entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own library entries" ON public.song_library FOR UPDATE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)) WITH CHECK ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: playlist_library Users can update their own playlist library entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own playlist library entries" ON public.playlist_library FOR UPDATE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)) WITH CHECK ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: playlist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.playlist ENABLE ROW LEVEL SECURITY;

--
-- Name: playlist_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.playlist_library ENABLE ROW LEVEL SECURITY;

--
-- Name: playlist_public; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.playlist_public ENABLE ROW LEVEL SECURITY;

--
-- Name: song; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.song ENABLE ROW LEVEL SECURITY;

--
-- Name: song_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.song_library ENABLE ROW LEVEL SECURITY;

--
-- Name: song_public; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.song_public ENABLE ROW LEVEL SECURITY;

--
-- Name: user; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_public; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_public ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict txwI0GV3tzKUPaYDUUsrZhECBf1OCYYxZ6PFm0NePuw3r7P6GVQnmuetFGS7iLb

