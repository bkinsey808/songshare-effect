--
-- PostgreSQL database dump
--

\restrict jW7wybHw1HDUeXX2M45LcLGkdL7a54ygWulKcKu9K3yTdV2gnZhoDJeivQYxaxG

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.6 (Ubuntu 17.6-1.pgdg22.04+1)

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
    linked_providers text[] DEFAULT '{}'::text[] NOT NULL,
    google_calendar_access text DEFAULT 'none'::text NOT NULL,
    google_calendar_refresh_token text,
    role text DEFAULT 'free'::text NOT NULL,
    role_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
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

\unrestrict jW7wybHw1HDUeXX2M45LcLGkdL7a54ygWulKcKu9K3yTdV2gnZhoDJeivQYxaxG

