--
-- PostgreSQL database dump
--

\restrict 8gaMJ0asKAG6qayQlgDyyyMiqL0j6AYGiR8G3VJBDVp5jd5RuYIKnbmAPOkUiYQ

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
-- Name: song_public Allow read access to song_public for visitors or users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to song_public for visitors or users" ON public.song_public FOR SELECT TO authenticated USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL) OR ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)));


--
-- Name: user_public Allow read access to user_public for visitors or users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to user_public for visitors or users" ON public.user_public FOR SELECT TO authenticated USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL) OR ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)));


--
-- Name: song Allow read for matching user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for matching user_id" ON public.song FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


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
-- Name: song_library Users can delete from their own library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete from their own library" ON public.song_library FOR DELETE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: song_library Users can update their own library entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own library entries" ON public.song_library FOR UPDATE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)) WITH CHECK ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: song_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.song_library ENABLE ROW LEVEL SECURITY;

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

\unrestrict 8gaMJ0asKAG6qayQlgDyyyMiqL0j6AYGiR8G3VJBDVp5jd5RuYIKnbmAPOkUiYQ

