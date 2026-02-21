--
-- PostgreSQL database dump
--

\restrict zBtyS6eKYKNK9NPaybA3PtLNelWdeK2LEEuFmnGeyXzS4sEbWnwcAHIPEaAH3zq

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
-- Name: debug_jwt(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.debug_jwt() RETURNS TABLE(jwt_text text, user_text text, user_id_text text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY SELECT 
    auth.jwt()::text,
    (auth.jwt() -> 'user')::text,
    ((auth.jwt() -> 'user' ->> 'user_id'))::text;
END;
$$;


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
-- Name: event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event (
    event_id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    private_notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE event; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.event IS 'Private event data - only accessible by the event owner';


--
-- Name: COLUMN event.event_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event.event_id IS 'Unique identifier for the event';


--
-- Name: COLUMN event.owner_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event.owner_id IS 'The user who owns this event';


--
-- Name: COLUMN event.private_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event.private_notes IS 'Private notes visible only to the owner';


--
-- Name: event_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_library (
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    event_owner_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE event_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.event_library IS 'Stores events that users have added to their personal library. Supports owned events, joined events, and discovered events.';


--
-- Name: COLUMN event_library.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_library.user_id IS 'The user who has saved this event to their library.';


--
-- Name: COLUMN event_library.event_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_library.event_id IS 'References the event being saved.';


--
-- Name: COLUMN event_library.event_owner_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_library.event_owner_id IS 'The original owner of the event (denormalized for easier querying).';


--
-- Name: COLUMN event_library.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_library.created_at IS 'Timestamp when the event was added to the user library.';


--
-- Name: event_public; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_public (
    event_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    event_name text NOT NULL,
    event_slug text NOT NULL,
    event_description text DEFAULT ''::text,
    event_date timestamp with time zone,
    is_public boolean DEFAULT false NOT NULL,
    active_playlist_id uuid,
    active_song_id uuid,
    public_notes text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    active_slide_position integer,
    CONSTRAINT event_name_format CHECK (((length(event_name) >= 2) AND (length(event_name) <= 100) AND (event_name = btrim(event_name)) AND (POSITION(('  '::text) IN (event_name)) = 0))),
    CONSTRAINT event_slug_format CHECK (((event_slug ~ '^[a-z0-9-]+$'::text) AND (event_slug !~ '^-'::text) AND (event_slug !~ '-$'::text) AND (POSITION(('--'::text) IN (event_slug)) = 0)))
);


--
-- Name: TABLE event_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.event_public IS 'Public event data with RLS enforcing owner/admin write access. Readable by authenticated users (public events) or participants. Realtime enabled for real-time sync.';


--
-- Name: COLUMN event_public.event_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_public.event_id IS 'Reference to the parent event record';


--
-- Name: COLUMN event_public.owner_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_public.owner_id IS 'The user who owns this event';


--
-- Name: COLUMN event_public.event_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_public.event_name IS 'Display name of the event';


--
-- Name: COLUMN event_public.event_slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_public.event_slug IS 'URL-friendly identifier, unique system-wide';


--
-- Name: COLUMN event_public.event_description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_public.event_description IS 'Description of the event';


--
-- Name: COLUMN event_public.event_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_public.event_date IS 'Date and time of the event';


--
-- Name: COLUMN event_public.is_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_public.is_public IS 'Whether the event is publicly viewable (including anonymous users)';


--
-- Name: COLUMN event_public.active_playlist_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_public.active_playlist_id IS 'Currently active playlist for this event';


--
-- Name: COLUMN event_public.active_song_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_public.active_song_id IS 'Currently active song within the active playlist';


--
-- Name: COLUMN event_public.public_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_public.public_notes IS 'Public notes visible to all event viewers';


--
-- Name: COLUMN event_public.active_slide_position; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_public.active_slide_position IS '1-based active slide position within the active song order';


--
-- Name: event_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_user (
    event_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'joined'::text NOT NULL,
    CONSTRAINT event_user_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'event_admin'::text, 'event_playlist_admin'::text, 'participant'::text]))),
    CONSTRAINT event_user_status_check CHECK ((status = ANY (ARRAY['invited'::text, 'joined'::text, 'left'::text, 'kicked'::text])))
);

ALTER TABLE ONLY public.event_user REPLICA IDENTITY FULL;


--
-- Name: TABLE event_user; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.event_user IS 'Event participants with roles - manages who can access and modify events. Realtime enabled for participant tracking.';


--
-- Name: COLUMN event_user.event_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_user.event_id IS 'Reference to the event';


--
-- Name: COLUMN event_user.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_user.user_id IS 'Reference to the user';


--
-- Name: COLUMN event_user.role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_user.role IS 'User role in this event: owner, event_admin, event_playlist_admin, or participant';


--
-- Name: COLUMN event_user.joined_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_user.joined_at IS 'When this user joined the event';


--
-- Name: COLUMN event_user.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_user.status IS 'Membership status in this event: invited, joined, left, or kicked';


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
-- Name: user_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_library (
    user_id uuid NOT NULL,
    followed_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.user_library REPLICA IDENTITY FULL;


--
-- Name: TABLE user_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_library IS 'Personal user libraries - allows users to follow other users. Realtime enabled.';


--
-- Name: COLUMN user_library.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_library.user_id IS 'The user who owns this library entry';


--
-- Name: COLUMN user_library.followed_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_library.followed_user_id IS 'The followed user id';


--
-- Name: COLUMN user_library.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_library.created_at IS 'When this user was added to the library';


--
-- Name: user_public; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_public (
    user_id uuid NOT NULL,
    username text NOT NULL
);

ALTER TABLE ONLY public.user_public REPLICA IDENTITY FULL;


--
-- Name: event_library event_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_library
    ADD CONSTRAINT event_library_pkey PRIMARY KEY (user_id, event_id);


--
-- Name: event event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_pkey PRIMARY KEY (event_id);


--
-- Name: event_public event_public_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_public
    ADD CONSTRAINT event_public_pkey PRIMARY KEY (event_id);


--
-- Name: event_public event_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_public
    ADD CONSTRAINT event_slug_unique UNIQUE (event_slug);


--
-- Name: event_user event_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_user
    ADD CONSTRAINT event_user_pkey PRIMARY KEY (event_id, user_id);


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
-- Name: user_library user_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_library
    ADD CONSTRAINT user_library_pkey PRIMARY KEY (user_id, followed_user_id);


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
-- Name: event_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_owner_id_idx ON public.event USING btree (owner_id);


--
-- Name: event_public_active_playlist_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_public_active_playlist_id_idx ON public.event_public USING btree (active_playlist_id);


--
-- Name: event_public_active_song_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_public_active_song_id_idx ON public.event_public USING btree (active_song_id);


--
-- Name: event_public_event_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_public_event_date_idx ON public.event_public USING btree (event_date DESC);


--
-- Name: event_public_event_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_public_event_slug_idx ON public.event_public USING btree (event_slug);


--
-- Name: event_public_is_public_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_public_is_public_idx ON public.event_public USING btree (is_public);


--
-- Name: event_public_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_public_owner_id_idx ON public.event_public USING btree (owner_id);


--
-- Name: event_user_event_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_user_event_id_idx ON public.event_user USING btree (event_id);


--
-- Name: event_user_joined_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_user_joined_at_idx ON public.event_user USING btree (joined_at DESC);


--
-- Name: event_user_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_user_role_idx ON public.event_user USING btree (role);


--
-- Name: event_user_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_user_status_idx ON public.event_user USING btree (status);


--
-- Name: event_user_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_user_user_id_idx ON public.event_user USING btree (user_id);


--
-- Name: idx_event_library_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_library_event_id ON public.event_library USING btree (event_id);


--
-- Name: idx_event_library_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_library_user_id ON public.event_library USING btree (user_id);


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
-- Name: user_library_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_library_created_at_idx ON public.user_library USING btree (created_at DESC);


--
-- Name: user_library_followed_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_library_followed_user_id_idx ON public.user_library USING btree (followed_user_id);


--
-- Name: user_library_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_library_user_id_idx ON public.user_library USING btree (user_id);


--
-- Name: event set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.event FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: event_public set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.event_public FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


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
-- Name: event_library event_library_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_library
    ADD CONSTRAINT event_library_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(event_id) ON DELETE CASCADE;


--
-- Name: event_library event_library_event_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_library
    ADD CONSTRAINT event_library_event_owner_id_fkey FOREIGN KEY (event_owner_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: CONSTRAINT event_library_event_owner_id_fkey ON event_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT event_library_event_owner_id_fkey ON public.event_library IS 'Ensures event_owner_id references a valid user. Cascades deletion if the owner is deleted.';


--
-- Name: event_library event_library_event_public_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_library
    ADD CONSTRAINT event_library_event_public_fkey FOREIGN KEY (event_id) REFERENCES public.event_public(event_id) ON DELETE CASCADE;


--
-- Name: CONSTRAINT event_library_event_public_fkey ON event_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT event_library_event_public_fkey ON public.event_library IS 'Enables PostgREST to join event_library with event_public for fetching event data.';


--
-- Name: event_library event_library_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_library
    ADD CONSTRAINT event_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: event event_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: event_public event_public_active_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_public
    ADD CONSTRAINT event_public_active_playlist_id_fkey FOREIGN KEY (active_playlist_id) REFERENCES public.playlist(playlist_id) ON DELETE SET NULL;


--
-- Name: event_public event_public_active_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_public
    ADD CONSTRAINT event_public_active_song_id_fkey FOREIGN KEY (active_song_id) REFERENCES public.song(song_id) ON DELETE SET NULL;


--
-- Name: event_public event_public_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_public
    ADD CONSTRAINT event_public_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(event_id) ON DELETE CASCADE;


--
-- Name: event_public event_public_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_public
    ADD CONSTRAINT event_public_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.user_public(user_id) ON DELETE CASCADE;


--
-- Name: CONSTRAINT event_public_owner_id_fkey ON event_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT event_public_owner_id_fkey ON public.event_public IS 'References the owner in user_public table. Enables PostgREST joins for fetching owner data.';


--
-- Name: event_user event_user_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_user
    ADD CONSTRAINT event_user_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(event_id) ON DELETE CASCADE;


--
-- Name: event_user event_user_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_user
    ADD CONSTRAINT event_user_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


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
-- Name: user_library user_library_followed_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_library
    ADD CONSTRAINT user_library_followed_user_id_fkey FOREIGN KEY (followed_user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: user_library user_library_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_library
    ADD CONSTRAINT user_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: user_public user_public_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_public
    ADD CONSTRAINT user_public_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: CONSTRAINT user_public_user_id_fkey ON user_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT user_public_user_id_fkey ON public.user_public IS 'Ensures user_public.user_id references a valid user. Cascades deletion if the user is deleted.';


--
-- Name: user_public user_public_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_public
    ADD CONSTRAINT user_public_userid_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: event_public Allow admins to update event fields; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow admins to update event fields" ON public.event_public FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.event_user
  WHERE ((event_user.event_id = event_public.event_id) AND (event_user.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid) AND (event_user.role = ANY (ARRAY['admin'::text, 'playlist-admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.event_user
  WHERE ((event_user.event_id = event_public.event_id) AND (event_user.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid) AND (event_user.role = ANY (ARRAY['admin'::text, 'playlist-admin'::text]))))));


--
-- Name: event_public Allow event admins to update event_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow event admins to update event_public" ON public.event_public FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.event_user
  WHERE ((event_user.event_id = event_public.event_id) AND (event_user.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid) AND (event_user.role = ANY (ARRAY['event_admin'::text, 'event_playlist_admin'::text])) AND (event_user.status = 'joined'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.event_user
  WHERE ((event_user.event_id = event_public.event_id) AND (event_user.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid) AND (event_user.role = ANY (ARRAY['event_admin'::text, 'event_playlist_admin'::text])) AND (event_user.status = 'joined'::text)))));


--
-- Name: event_public Allow owner to delete own event_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow owner to delete own event_public" ON public.event_public FOR DELETE USING ((owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: event_public Allow owner to read own event_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow owner to read own event_public" ON public.event_public FOR SELECT TO authenticated USING ((owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: event_public Allow owner to update event fields; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow owner to update event fields" ON public.event_public FOR UPDATE TO authenticated USING ((owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)) WITH CHECK ((owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: event_public Allow owner to update own event_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow owner to update own event_public" ON public.event_public FOR UPDATE USING ((owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)) WITH CHECK ((owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: playlist_public Allow read access to playlist_public for visitors or users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to playlist_public for visitors or users" ON public.playlist_public FOR SELECT TO authenticated USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL) OR ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)));


--
-- Name: event_public Allow read access to private events for participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to private events for participants" ON public.event_public FOR SELECT TO authenticated USING (((is_public = false) AND (EXISTS ( SELECT 1
   FROM public.event_user
  WHERE ((event_user.event_id = event_public.event_id) AND (event_user.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid) AND (event_user.status = ANY (ARRAY['invited'::text, 'joined'::text, 'left'::text])))))));


--
-- Name: event_public Allow read access to public events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to public events" ON public.event_public FOR SELECT TO authenticated USING (((is_public = true) AND ((((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL) OR ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL))));


--
-- Name: song_public Allow read access to song_public for visitors or users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to song_public for visitors or users" ON public.song_public FOR SELECT TO authenticated USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL) OR ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)));


--
-- Name: user_public Allow read access to user_public for visitors or users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to user_public for visitors or users" ON public.user_public FOR SELECT TO authenticated USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL) OR ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)));


--
-- Name: event Allow read for matching owner_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for matching owner_id" ON public.event FOR SELECT TO authenticated USING ((owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: playlist Allow read for matching user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for matching user_id" ON public.playlist FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: song Allow read for matching user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for matching user_id" ON public.song FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: event_user Deny all INSERT operations on event_user; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all INSERT operations on event_user" ON public.event_user FOR INSERT TO authenticated WITH CHECK (false);


--
-- Name: POLICY "Deny all INSERT operations on event_user" ON event_user; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Deny all INSERT operations on event_user" ON public.event_user IS 'All inserts must go through the /api/event-user/add server endpoint for proper validation and authorization.';


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
-- Name: user_library Deny all INSERT operations on user_library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all INSERT operations on user_library" ON public.user_library FOR INSERT TO authenticated WITH CHECK (false);


--
-- Name: POLICY "Deny all INSERT operations on user_library" ON user_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Deny all INSERT operations on user_library" ON public.user_library IS 'All inserts must go through the /api/user-library/add server endpoint for proper validation and authorization.';


--
-- Name: event_user Users can access their own event entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can access their own event entries" ON public.event_user FOR SELECT TO authenticated USING (((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid) AND (status = ANY (ARRAY['invited'::text, 'joined'::text, 'left'::text]))));


--
-- Name: song_library Users can access their own library entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can access their own library entries" ON public.song_library FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: playlist_library Users can access their own playlist library entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can access their own playlist library entries" ON public.playlist_library FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: user_library Users can access their own user library entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can access their own user library entries" ON public.user_library FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: song_library Users can delete from their own library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete from their own library" ON public.song_library FOR DELETE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: playlist_library Users can delete from their own playlist library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete from their own playlist library" ON public.playlist_library FOR DELETE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: user_library Users can delete from their own user library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete from their own user library" ON public.user_library FOR DELETE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: event_user Users can delete their own event entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own event entries" ON public.event_user FOR DELETE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: event_user Users can update their own event entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own event entries" ON public.event_user FOR UPDATE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)) WITH CHECK ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: song_library Users can update their own library entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own library entries" ON public.song_library FOR UPDATE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)) WITH CHECK ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: playlist_library Users can update their own playlist library entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own playlist library entries" ON public.playlist_library FOR UPDATE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)) WITH CHECK ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: user_library Users can update their own user library entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own user library entries" ON public.user_library FOR UPDATE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)) WITH CHECK ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: event; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event ENABLE ROW LEVEL SECURITY;

--
-- Name: event_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_library ENABLE ROW LEVEL SECURITY;

--
-- Name: event_library event_library_delete_own_entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_library_delete_own_entries ON public.event_library FOR DELETE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: event_library event_library_insert_own_entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_library_insert_own_entries ON public.event_library FOR INSERT TO authenticated WITH CHECK ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: event_library event_library_select_own_entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_library_select_own_entries ON public.event_library FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: event_public; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_public ENABLE ROW LEVEL SECURITY;

--
-- Name: event_user; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_user ENABLE ROW LEVEL SECURITY;

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
-- Name: user_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

--
-- Name: user_public; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_public ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict zBtyS6eKYKNK9NPaybA3PtLNelWdeK2LEEuFmnGeyXzS4sEbWnwcAHIPEaAH3zq

