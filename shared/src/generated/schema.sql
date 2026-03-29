--
-- PostgreSQL database dump
--

\restrict NSUrIFc73dVdwKiaTmg4OkpJ9RHPVYWlxcrZtzhid27fqqV9s7D3pr3nE8cq34K

-- Dumped from database version 17.6
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
-- Name: is_community_admin(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_community_admin(p_community_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.community_user
    WHERE community_id = p_community_id
    AND user_id = p_user_id
    AND role = 'community_admin'::text
  );
END;
$$;


--
-- Name: is_community_owner(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_community_owner(p_community_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.community_public
    WHERE community_id = p_community_id
    AND owner_id = p_user_id
  );
END;
$$;


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
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
-- Name: community; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community (
    community_id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    private_notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE community; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.community IS 'Private community data - only accessible by the community owner';


--
-- Name: community_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_event (
    community_id uuid NOT NULL,
    event_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.community_event REPLICA IDENTITY FULL;


--
-- Name: TABLE community_event; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.community_event IS 'Many-to-many relationship between communities and events.';


--
-- Name: community_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_library (
    user_id uuid NOT NULL,
    community_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.community_library REPLICA IDENTITY FULL;


--
-- Name: TABLE community_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.community_library IS 'Stores communities that users have added to their personal library. Supports owned communities, joined communities, and discovered communities.';


--
-- Name: COLUMN community_library.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.community_library.user_id IS 'The user who has saved this community to their library.';


--
-- Name: COLUMN community_library.community_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.community_library.community_id IS 'References the community being saved.';


--
-- Name: COLUMN community_library.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.community_library.created_at IS 'Timestamp when the community was added to the user library.';


--
-- Name: community_playlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_playlist (
    community_id uuid NOT NULL,
    playlist_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE community_playlist; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.community_playlist IS 'Playlists associated with a community.';


--
-- Name: community_public; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_public (
    community_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    community_name text NOT NULL,
    community_slug text NOT NULL,
    description text DEFAULT ''::text,
    is_public boolean DEFAULT false NOT NULL,
    public_notes text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    active_event_id uuid,
    CONSTRAINT community_name_format CHECK (((length(community_name) >= 2) AND (length(community_name) <= 100) AND (community_name = btrim(community_name)) AND (POSITION(('  '::text) IN (community_name)) = 0))),
    CONSTRAINT community_slug_format CHECK (((community_slug ~ '^[a-z0-9-]+$'::text) AND (community_slug !~ '^-'::text) AND (community_slug !~ '-$'::text) AND (POSITION(('--'::text) IN (community_slug)) = 0)))
);

ALTER TABLE ONLY public.community_public REPLICA IDENTITY FULL;


--
-- Name: TABLE community_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.community_public IS 'Public community data. Readable by anyone, writable by owner/admin.';


--
-- Name: COLUMN community_public.active_event_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.community_public.active_event_id IS 'The currently active event for this community, shown automatically on the Community View page. Nullable; set/unset by community owners and admins via the API.';


--
-- Name: community_share_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_share_request (
    request_id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id uuid NOT NULL,
    sender_user_id uuid NOT NULL,
    shared_item_type text NOT NULL,
    shared_item_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    message text DEFAULT ''::text,
    reviewed_by_user_id uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT community_share_request_shared_item_type_check CHECK ((shared_item_type = ANY (ARRAY['song'::text, 'playlist'::text]))),
    CONSTRAINT community_share_request_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);


--
-- Name: community_song; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_song (
    community_id uuid NOT NULL,
    song_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE community_song; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.community_song IS 'Songs associated with a community.';


--
-- Name: community_tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_tag (
    community_id uuid NOT NULL,
    tag_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.community_tag REPLICA IDENTITY FULL;


--
-- Name: TABLE community_tag; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.community_tag IS 'Tags applied to communities by the community owner';


--
-- Name: community_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_user (
    community_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'joined'::text NOT NULL,
    CONSTRAINT community_user_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'community_admin'::text, 'member'::text]))),
    CONSTRAINT community_user_status_check CHECK ((status = ANY (ARRAY['invited'::text, 'joined'::text, 'left'::text, 'kicked'::text])))
);

ALTER TABLE ONLY public.community_user REPLICA IDENTITY FULL;


--
-- Name: TABLE community_user; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.community_user IS 'RLS re-enabled after fixing invitation fetch logic.';


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

ALTER TABLE ONLY public.event_public REPLICA IDENTITY FULL;


--
-- Name: TABLE event_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.event_public IS 'RLS re-enabled after fixing invitation fetch logic.';


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
-- Name: event_tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_tag (
    event_id uuid NOT NULL,
    tag_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.event_tag REPLICA IDENTITY FULL;


--
-- Name: TABLE event_tag; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.event_tag IS 'Tags applied to events by the event owner';


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
-- Name: image; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.image (
    image_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    private_notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE image; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.image IS 'Private image data - only accessible by the image owner';


--
-- Name: COLUMN image.image_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.image.image_id IS 'Unique identifier for the image';


--
-- Name: COLUMN image.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.image.user_id IS 'The user who owns this image';


--
-- Name: COLUMN image.private_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.image.private_notes IS 'Private notes visible only to the owner';


--
-- Name: image_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.image_library (
    user_id uuid NOT NULL,
    image_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.image_library REPLICA IDENTITY FULL;


--
-- Name: TABLE image_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.image_library IS 'User image bookmarks / collection';


--
-- Name: image_public; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.image_public (
    image_id uuid NOT NULL,
    user_id uuid NOT NULL,
    image_name text DEFAULT ''::text NOT NULL,
    image_slug text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    alt_text text DEFAULT ''::text NOT NULL,
    r2_key text NOT NULL,
    content_type text DEFAULT 'image/jpeg'::text NOT NULL,
    file_size integer DEFAULT 0 NOT NULL,
    width integer,
    height integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.image_public REPLICA IDENTITY FULL;


--
-- Name: TABLE image_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.image_public IS 'Public image metadata - readable by all authenticated users';


--
-- Name: COLUMN image_public.r2_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.image_public.r2_key IS 'Cloudflare R2 storage key for the image file';


--
-- Name: COLUMN image_public.content_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.image_public.content_type IS 'MIME type of the image (e.g. image/jpeg, image/png)';


--
-- Name: COLUMN image_public.file_size; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.image_public.file_size IS 'File size in bytes';


--
-- Name: COLUMN image_public.width; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.image_public.width IS 'Image width in pixels (optional)';


--
-- Name: COLUMN image_public.height; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.image_public.height IS 'Image height in pixels (optional)';


--
-- Name: image_tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.image_tag (
    image_id uuid NOT NULL,
    tag_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.image_tag REPLICA IDENTITY FULL;


--
-- Name: TABLE image_tag; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.image_tag IS 'Tags applied to images by the image owner';


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
-- Name: playlist_tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playlist_tag (
    playlist_id uuid NOT NULL,
    tag_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.playlist_tag REPLICA IDENTITY FULL;


--
-- Name: TABLE playlist_tag; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.playlist_tag IS 'Tags applied to playlists by the playlist owner';


--
-- Name: share; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.share (
    share_id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_user_id uuid NOT NULL,
    private_notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE share; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.share IS 'Private share data - only accessible by the share sender';


--
-- Name: COLUMN share.share_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.share.share_id IS 'Unique identifier for the share';


--
-- Name: COLUMN share.sender_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.share.sender_user_id IS 'The user who created this share';


--
-- Name: COLUMN share.private_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.share.private_notes IS 'Private notes visible only to the sender';


--
-- Name: share_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.share_library (
    user_id uuid NOT NULL,
    share_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.share_library REPLICA IDENTITY FULL;


--
-- Name: TABLE share_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.share_library IS 'Personal share libraries - allows users to organize received shares. Realtime enabled.';


--
-- Name: COLUMN share_library.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.share_library.user_id IS 'The user who owns this library entry';


--
-- Name: COLUMN share_library.share_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.share_library.share_id IS 'Reference to the share being added to library';


--
-- Name: COLUMN share_library.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.share_library.created_at IS 'When this share was added to the user library';


--
-- Name: share_public; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.share_public (
    share_id uuid NOT NULL,
    sender_user_id uuid NOT NULL,
    recipient_user_id uuid NOT NULL,
    shared_item_type text NOT NULL,
    shared_item_id uuid NOT NULL,
    shared_item_name text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    message text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT share_public_shared_item_type_check CHECK ((shared_item_type = ANY (ARRAY['song'::text, 'playlist'::text, 'event'::text, 'community'::text, 'user'::text, 'image'::text]))),
    CONSTRAINT share_public_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);

ALTER TABLE ONLY public.share_public REPLICA IDENTITY FULL;


--
-- Name: TABLE share_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.share_public IS 'Public share data - readable by sender and recipient, writable via API only';


--
-- Name: COLUMN share_public.share_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.share_public.share_id IS 'Reference to the parent share record';


--
-- Name: COLUMN share_public.sender_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.share_public.sender_user_id IS 'The user who created this share';


--
-- Name: COLUMN share_public.recipient_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.share_public.recipient_user_id IS 'The user who received this share';


--
-- Name: COLUMN share_public.shared_item_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.share_public.shared_item_type IS 'Type of item being shared: song, playlist, event, community, or user';


--
-- Name: COLUMN share_public.shared_item_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.share_public.shared_item_id IS 'ID of the item being shared';


--
-- Name: COLUMN share_public.shared_item_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.share_public.shared_item_name IS 'Display name of the shared item';


--
-- Name: COLUMN share_public.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.share_public.status IS 'Share status: pending, accepted, or rejected';


--
-- Name: COLUMN share_public.message; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.share_public.message IS 'Optional message from sender to recipient';


--
-- Name: CONSTRAINT share_public_shared_item_type_check ON share_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT share_public_shared_item_type_check ON public.share_public IS 'Restrict shared_item_type to known resource types including image';


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
-- Name: song_tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.song_tag (
    song_id uuid NOT NULL,
    tag_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.song_tag REPLICA IDENTITY FULL;


--
-- Name: TABLE song_tag; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.song_tag IS 'Tags applied to songs by the song owner';


--
-- Name: tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tag (
    tag_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.tag REPLICA IDENTITY FULL;


--
-- Name: TABLE tag; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tag IS 'Global tag registry — tags are identified by their kebab-case slug';


--
-- Name: COLUMN tag.tag_slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tag.tag_slug IS 'Kebab-case slug, e.g. "indie-rock". Acts as the primary key.';


--
-- Name: tag_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tag_library (
    user_id uuid NOT NULL,
    tag_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.tag_library REPLICA IDENTITY FULL;


--
-- Name: TABLE tag_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tag_library IS 'User''s personal bookmarked tags — for quick navigation and autocomplete';


--
-- Name: COLUMN tag_library.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tag_library.user_id IS 'The user who bookmarked this tag';


--
-- Name: COLUMN tag_library.tag_slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tag_library.tag_slug IS 'The bookmarked tag slug';


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
-- Name: community_event community_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_event
    ADD CONSTRAINT community_event_pkey PRIMARY KEY (community_id, event_id);


--
-- Name: community_library community_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_library
    ADD CONSTRAINT community_library_pkey PRIMARY KEY (user_id, community_id);


--
-- Name: community community_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community
    ADD CONSTRAINT community_pkey PRIMARY KEY (community_id);


--
-- Name: community_playlist community_playlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_playlist
    ADD CONSTRAINT community_playlist_pkey PRIMARY KEY (community_id, playlist_id);


--
-- Name: community_public community_public_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_public
    ADD CONSTRAINT community_public_pkey PRIMARY KEY (community_id);


--
-- Name: community_share_request community_share_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_share_request
    ADD CONSTRAINT community_share_request_pkey PRIMARY KEY (request_id);


--
-- Name: community_public community_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_public
    ADD CONSTRAINT community_slug_unique UNIQUE (community_slug);


--
-- Name: community_song community_song_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_song
    ADD CONSTRAINT community_song_pkey PRIMARY KEY (community_id, song_id);


--
-- Name: community_tag community_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_tag
    ADD CONSTRAINT community_tag_pkey PRIMARY KEY (community_id, tag_slug);


--
-- Name: community_user community_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_user
    ADD CONSTRAINT community_user_pkey PRIMARY KEY (community_id, user_id);


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
-- Name: event_tag event_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_tag
    ADD CONSTRAINT event_tag_pkey PRIMARY KEY (event_id, tag_slug);


--
-- Name: event_user event_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_user
    ADD CONSTRAINT event_user_pkey PRIMARY KEY (event_id, user_id);


--
-- Name: image_library image_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_library
    ADD CONSTRAINT image_library_pkey PRIMARY KEY (user_id, image_id);


--
-- Name: image image_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT image_pkey PRIMARY KEY (image_id);


--
-- Name: image_public image_public_image_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_public
    ADD CONSTRAINT image_public_image_slug_key UNIQUE (image_slug);


--
-- Name: image_public image_public_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_public
    ADD CONSTRAINT image_public_pkey PRIMARY KEY (image_id);


--
-- Name: image_tag image_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_tag
    ADD CONSTRAINT image_tag_pkey PRIMARY KEY (image_id, tag_slug);


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
-- Name: playlist_tag playlist_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_tag
    ADD CONSTRAINT playlist_tag_pkey PRIMARY KEY (playlist_id, tag_slug);


--
-- Name: share_library share_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share_library
    ADD CONSTRAINT share_library_pkey PRIMARY KEY (user_id, share_id);


--
-- Name: share share_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share
    ADD CONSTRAINT share_pkey PRIMARY KEY (share_id);


--
-- Name: share_public share_public_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share_public
    ADD CONSTRAINT share_public_pkey PRIMARY KEY (share_id);


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
-- Name: song_tag song_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_tag
    ADD CONSTRAINT song_tag_pkey PRIMARY KEY (song_id, tag_slug);


--
-- Name: tag_library tag_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_library
    ADD CONSTRAINT tag_library_pkey PRIMARY KEY (user_id, tag_slug);


--
-- Name: tag tag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_pkey PRIMARY KEY (tag_slug);


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
-- Name: community_share_request_community_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX community_share_request_community_id_idx ON public.community_share_request USING btree (community_id, status, created_at DESC);


--
-- Name: community_share_request_pending_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX community_share_request_pending_unique_idx ON public.community_share_request USING btree (community_id, sender_user_id, shared_item_type, shared_item_id) WHERE (status = 'pending'::text);


--
-- Name: community_tag_community_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX community_tag_community_id_idx ON public.community_tag USING btree (community_id);


--
-- Name: community_tag_tag_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX community_tag_tag_slug_idx ON public.community_tag USING btree (tag_slug);


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
-- Name: event_tag_event_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_tag_event_id_idx ON public.event_tag USING btree (event_id);


--
-- Name: event_tag_tag_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_tag_tag_slug_idx ON public.event_tag USING btree (tag_slug);


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
-- Name: idx_community_library_community_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_community_library_community_id ON public.community_library USING btree (community_id);


--
-- Name: idx_community_library_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_community_library_user_id ON public.community_library USING btree (user_id);


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
-- Name: image_library_image_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX image_library_image_id_idx ON public.image_library USING btree (image_id);


--
-- Name: image_library_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX image_library_user_id_idx ON public.image_library USING btree (user_id);


--
-- Name: image_public_image_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX image_public_image_slug_idx ON public.image_public USING btree (image_slug);


--
-- Name: image_public_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX image_public_user_id_idx ON public.image_public USING btree (user_id);


--
-- Name: image_tag_image_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX image_tag_image_id_idx ON public.image_tag USING btree (image_id);


--
-- Name: image_tag_tag_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX image_tag_tag_slug_idx ON public.image_tag USING btree (tag_slug);


--
-- Name: image_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX image_user_id_idx ON public.image USING btree (user_id);


--
-- Name: playlist_library_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlist_library_created_at_idx ON public.playlist_library USING btree (created_at DESC);


--
-- Name: playlist_library_playlist_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlist_library_playlist_id_idx ON public.playlist_library USING btree (playlist_id);


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
-- Name: playlist_tag_playlist_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlist_tag_playlist_id_idx ON public.playlist_tag USING btree (playlist_id);


--
-- Name: playlist_tag_tag_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlist_tag_tag_slug_idx ON public.playlist_tag USING btree (tag_slug);


--
-- Name: playlist_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlist_user_id_idx ON public.playlist USING btree (user_id);


--
-- Name: share_library_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX share_library_created_at_idx ON public.share_library USING btree (created_at DESC);


--
-- Name: share_library_share_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX share_library_share_id_idx ON public.share_library USING btree (share_id);


--
-- Name: share_library_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX share_library_user_id_idx ON public.share_library USING btree (user_id);


--
-- Name: share_public_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX share_public_created_at_idx ON public.share_public USING btree (created_at DESC);


--
-- Name: share_public_one_per_user_per_item_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX share_public_one_per_user_per_item_idx ON public.share_public USING btree (sender_user_id, recipient_user_id, shared_item_type, shared_item_id);


--
-- Name: INDEX share_public_one_per_user_per_item_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.share_public_one_per_user_per_item_idx IS 'Ensures at most one pending/accepted/rejected share per sender+recipient+item combination';


--
-- Name: share_public_recipient_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX share_public_recipient_user_id_idx ON public.share_public USING btree (recipient_user_id);


--
-- Name: share_public_sender_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX share_public_sender_user_id_idx ON public.share_public USING btree (sender_user_id);


--
-- Name: share_public_shared_item_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX share_public_shared_item_type_idx ON public.share_public USING btree (shared_item_type);


--
-- Name: share_public_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX share_public_status_idx ON public.share_public USING btree (status);


--
-- Name: share_sender_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX share_sender_user_id_idx ON public.share USING btree (sender_user_id);


--
-- Name: song_library_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX song_library_created_at_idx ON public.song_library USING btree (created_at DESC);


--
-- Name: song_library_song_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX song_library_song_id_idx ON public.song_library USING btree (song_id);


--
-- Name: song_library_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX song_library_user_id_idx ON public.song_library USING btree (user_id);


--
-- Name: song_public_song_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX song_public_song_slug_idx ON public.song_public USING btree (song_slug);


--
-- Name: song_tag_song_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX song_tag_song_id_idx ON public.song_tag USING btree (song_id);


--
-- Name: song_tag_tag_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX song_tag_tag_slug_idx ON public.song_tag USING btree (tag_slug);


--
-- Name: tag_library_tag_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tag_library_tag_slug_idx ON public.tag_library USING btree (tag_slug);


--
-- Name: tag_library_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tag_library_user_id_idx ON public.tag_library USING btree (user_id);


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
-- Name: community set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.community FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: community_public set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.community_public FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: community_share_request set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.community_share_request FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


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
-- Name: share set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.share FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: share_public set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.share_public FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


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
-- Name: community_event community_event_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_event
    ADD CONSTRAINT community_event_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.community(community_id) ON DELETE CASCADE;


--
-- Name: community_event community_event_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_event
    ADD CONSTRAINT community_event_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(event_id) ON DELETE CASCADE;


--
-- Name: community_library community_library_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_library
    ADD CONSTRAINT community_library_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.community(community_id) ON DELETE CASCADE;


--
-- Name: community_library community_library_community_public_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_library
    ADD CONSTRAINT community_library_community_public_fkey FOREIGN KEY (community_id) REFERENCES public.community_public(community_id) ON DELETE CASCADE;


--
-- Name: CONSTRAINT community_library_community_public_fkey ON community_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT community_library_community_public_fkey ON public.community_library IS 'Enables PostgREST to join community_library with community_public for fetching community data.';


--
-- Name: community_library community_library_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_library
    ADD CONSTRAINT community_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: community community_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community
    ADD CONSTRAINT community_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: community_playlist community_playlist_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_playlist
    ADD CONSTRAINT community_playlist_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.community(community_id) ON DELETE CASCADE;


--
-- Name: community_playlist community_playlist_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_playlist
    ADD CONSTRAINT community_playlist_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlist(playlist_id) ON DELETE CASCADE;


--
-- Name: community_public community_public_active_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_public
    ADD CONSTRAINT community_public_active_event_id_fkey FOREIGN KEY (active_event_id) REFERENCES public.event(event_id) ON DELETE SET NULL;


--
-- Name: community_public community_public_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_public
    ADD CONSTRAINT community_public_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.community(community_id) ON DELETE CASCADE;


--
-- Name: community_share_request community_share_request_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_share_request
    ADD CONSTRAINT community_share_request_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.community(community_id) ON DELETE CASCADE;


--
-- Name: community_share_request community_share_request_reviewed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_share_request
    ADD CONSTRAINT community_share_request_reviewed_by_user_id_fkey FOREIGN KEY (reviewed_by_user_id) REFERENCES public."user"(user_id) ON DELETE SET NULL;


--
-- Name: community_share_request community_share_request_sender_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_share_request
    ADD CONSTRAINT community_share_request_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: community_song community_song_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_song
    ADD CONSTRAINT community_song_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.community(community_id) ON DELETE CASCADE;


--
-- Name: community_song community_song_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_song
    ADD CONSTRAINT community_song_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.song(song_id) ON DELETE CASCADE;


--
-- Name: community_tag community_tag_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_tag
    ADD CONSTRAINT community_tag_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.community_public(community_id) ON DELETE CASCADE;


--
-- Name: community_tag community_tag_tag_slug_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_tag
    ADD CONSTRAINT community_tag_tag_slug_fkey FOREIGN KEY (tag_slug) REFERENCES public.tag(tag_slug) ON DELETE CASCADE;


--
-- Name: community_user community_user_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_user
    ADD CONSTRAINT community_user_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.community(community_id) ON DELETE CASCADE;


--
-- Name: community_user community_user_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_user
    ADD CONSTRAINT community_user_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: event_library event_library_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_library
    ADD CONSTRAINT event_library_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(event_id) ON DELETE CASCADE;


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
-- Name: event_tag event_tag_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_tag
    ADD CONSTRAINT event_tag_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_public(event_id) ON DELETE CASCADE;


--
-- Name: event_tag event_tag_tag_slug_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_tag
    ADD CONSTRAINT event_tag_tag_slug_fkey FOREIGN KEY (tag_slug) REFERENCES public.tag(tag_slug) ON DELETE CASCADE;


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
-- Name: image_library image_library_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_library
    ADD CONSTRAINT image_library_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.image_public(image_id) ON DELETE CASCADE;


--
-- Name: image_library image_library_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_library
    ADD CONSTRAINT image_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: image_public image_public_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_public
    ADD CONSTRAINT image_public_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.image(image_id) ON DELETE CASCADE;


--
-- Name: image_public image_public_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_public
    ADD CONSTRAINT image_public_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: image_tag image_tag_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_tag
    ADD CONSTRAINT image_tag_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.image_public(image_id) ON DELETE CASCADE;


--
-- Name: image_tag image_tag_tag_slug_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_tag
    ADD CONSTRAINT image_tag_tag_slug_fkey FOREIGN KEY (tag_slug) REFERENCES public.tag(tag_slug) ON DELETE CASCADE;


--
-- Name: image image_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT image_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: playlist_library playlist_library_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_library
    ADD CONSTRAINT playlist_library_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlist(playlist_id) ON DELETE CASCADE;


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
-- Name: playlist_tag playlist_tag_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_tag
    ADD CONSTRAINT playlist_tag_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlist_public(playlist_id) ON DELETE CASCADE;


--
-- Name: playlist_tag playlist_tag_tag_slug_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_tag
    ADD CONSTRAINT playlist_tag_tag_slug_fkey FOREIGN KEY (tag_slug) REFERENCES public.tag(tag_slug) ON DELETE CASCADE;


--
-- Name: playlist playlist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist
    ADD CONSTRAINT playlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: share_library share_library_share_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share_library
    ADD CONSTRAINT share_library_share_id_fkey FOREIGN KEY (share_id) REFERENCES public.share(share_id) ON DELETE CASCADE;


--
-- Name: share_library share_library_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share_library
    ADD CONSTRAINT share_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: share_public share_public_recipient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share_public
    ADD CONSTRAINT share_public_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES public.user_public(user_id) ON DELETE CASCADE;


--
-- Name: share_public share_public_sender_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share_public
    ADD CONSTRAINT share_public_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES public.user_public(user_id) ON DELETE CASCADE;


--
-- Name: share_public share_public_share_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share_public
    ADD CONSTRAINT share_public_share_id_fkey FOREIGN KEY (share_id) REFERENCES public.share(share_id) ON DELETE CASCADE;


--
-- Name: share share_sender_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share
    ADD CONSTRAINT share_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: song_library song_library_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_library
    ADD CONSTRAINT song_library_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.song(song_id) ON DELETE CASCADE;


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
-- Name: song_tag song_tag_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_tag
    ADD CONSTRAINT song_tag_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.song_public(song_id) ON DELETE CASCADE;


--
-- Name: song_tag song_tag_tag_slug_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_tag
    ADD CONSTRAINT song_tag_tag_slug_fkey FOREIGN KEY (tag_slug) REFERENCES public.tag(tag_slug) ON DELETE CASCADE;


--
-- Name: song song_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song
    ADD CONSTRAINT song_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: tag_library tag_library_tag_slug_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_library
    ADD CONSTRAINT tag_library_tag_slug_fkey FOREIGN KEY (tag_slug) REFERENCES public.tag(tag_slug) ON DELETE CASCADE;


--
-- Name: tag_library tag_library_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_library
    ADD CONSTRAINT tag_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


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
-- Name: community_public Allow read access to community_public for everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to community_public for everyone" ON public.community_public FOR SELECT TO authenticated USING (true);


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
-- Name: share_public Allow read access to share_public for sender and recipient; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to share_public for sender and recipient" ON public.share_public FOR SELECT TO authenticated USING (((sender_user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid) OR (recipient_user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)));


--
-- Name: song_public Allow read access to song_public for visitors or users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to song_public for visitors or users" ON public.song_public FOR SELECT TO authenticated USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL) OR ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)));


--
-- Name: user_public Allow read access to user_public for visitors or users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to user_public for visitors or users" ON public.user_public FOR SELECT TO authenticated USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL) OR ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)));


--
-- Name: community_tag Allow read for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for authenticated users" ON public.community_tag FOR SELECT TO authenticated USING (true);


--
-- Name: event_tag Allow read for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for authenticated users" ON public.event_tag FOR SELECT TO authenticated USING (true);


--
-- Name: image_public Allow read for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for authenticated users" ON public.image_public FOR SELECT TO authenticated USING (true);


--
-- Name: image_tag Allow read for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for authenticated users" ON public.image_tag FOR SELECT TO authenticated USING (true);


--
-- Name: playlist_tag Allow read for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for authenticated users" ON public.playlist_tag FOR SELECT TO authenticated USING (true);


--
-- Name: song_tag Allow read for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for authenticated users" ON public.song_tag FOR SELECT TO authenticated USING (true);


--
-- Name: tag Allow read for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for authenticated users" ON public.tag FOR SELECT TO authenticated USING (true);


--
-- Name: community Allow read for matching owner_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for matching owner_id" ON public.community FOR SELECT TO authenticated USING ((owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: event Allow read for matching owner_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for matching owner_id" ON public.event FOR SELECT TO authenticated USING ((owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: share Allow read for matching sender_user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for matching sender_user_id" ON public.share FOR SELECT TO authenticated USING ((sender_user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: image Allow read for matching user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for matching user_id" ON public.image FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: image_library Allow read for matching user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for matching user_id" ON public.image_library FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: playlist Allow read for matching user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for matching user_id" ON public.playlist FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: song Allow read for matching user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for matching user_id" ON public.song FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: tag_library Allow read for matching user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for matching user_id" ON public.tag_library FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: community_event Anyone can see community events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can see community events" ON public.community_event FOR SELECT TO authenticated USING (true);


--
-- Name: community_playlist Anyone can see community playlists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can see community playlists" ON public.community_playlist FOR SELECT TO authenticated USING (true);


--
-- Name: community_song Anyone can see community songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can see community songs" ON public.community_song FOR SELECT TO authenticated USING (true);


--
-- Name: community_user Community admins can see all members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community admins can see all members" ON public.community_user FOR SELECT TO authenticated USING (public.is_community_admin(community_id, ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: community_user Community owners can see all members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community owners can see all members" ON public.community_user FOR SELECT TO authenticated USING (public.is_community_owner(community_id, ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


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
-- Name: share_library Deny all INSERT operations on share_library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all INSERT operations on share_library" ON public.share_library FOR INSERT TO authenticated WITH CHECK (false);


--
-- Name: POLICY "Deny all INSERT operations on share_library" ON share_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Deny all INSERT operations on share_library" ON public.share_library IS 'All inserts must go through the /api/shares/create server endpoint for proper validation and authorization.';


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
-- Name: community Deny all mutations on community; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on community" ON public.community TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: POLICY "Deny all mutations on community" ON community; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Deny all mutations on community" ON public.community IS 'All community mutations must go through the API server for proper validation and authorization.';


--
-- Name: community_event Deny all mutations on community_event; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on community_event" ON public.community_event TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: POLICY "Deny all mutations on community_event" ON community_event; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Deny all mutations on community_event" ON public.community_event IS 'All community event association mutations must go through the API server for proper validation and authorization.';


--
-- Name: community_public Deny all mutations on community_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on community_public" ON public.community_public TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: POLICY "Deny all mutations on community_public" ON community_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Deny all mutations on community_public" ON public.community_public IS 'All community mutations must go through the API server for proper validation and authorization.';


--
-- Name: community_tag Deny all mutations on community_tag; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on community_tag" ON public.community_tag TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: community_user Deny all mutations on community_user; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on community_user" ON public.community_user TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: POLICY "Deny all mutations on community_user" ON community_user; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Deny all mutations on community_user" ON public.community_user IS 'All community membership mutations must go through the API server for proper validation and authorization.';


--
-- Name: event_tag Deny all mutations on event_tag; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on event_tag" ON public.event_tag TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: image Deny all mutations on image; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on image" ON public.image TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: image_library Deny all mutations on image_library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on image_library" ON public.image_library TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: image_public Deny all mutations on image_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on image_public" ON public.image_public TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: image_tag Deny all mutations on image_tag; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on image_tag" ON public.image_tag TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: playlist_tag Deny all mutations on playlist_tag; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on playlist_tag" ON public.playlist_tag TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: share Deny all mutations on share; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on share" ON public.share TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: POLICY "Deny all mutations on share" ON share; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Deny all mutations on share" ON public.share IS 'All share mutations must go through the API server for proper validation and authorization.';


--
-- Name: share_public Deny all mutations on share_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on share_public" ON public.share_public TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: POLICY "Deny all mutations on share_public" ON share_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Deny all mutations on share_public" ON public.share_public IS 'All share mutations must go through the API server for proper validation and authorization.';


--
-- Name: song_tag Deny all mutations on song_tag; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on song_tag" ON public.song_tag TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: tag Deny all mutations on tag; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on tag" ON public.tag TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: tag_library Deny all mutations on tag_library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all mutations on tag_library" ON public.tag_library TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: community_playlist Deny direct community playlist mutations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny direct community playlist mutations" ON public.community_playlist TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: community_share_request Deny direct community share request mutations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny direct community share request mutations" ON public.community_share_request TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: community_song Deny direct community song mutations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny direct community song mutations" ON public.community_song TO authenticated, anon USING (false) WITH CHECK (false);


--
-- Name: community_share_request Members can read community share requests they sent or manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can read community share requests they sent or manage" ON public.community_share_request FOR SELECT TO authenticated USING (((sender_user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid) OR (EXISTS ( SELECT 1
   FROM public.community_user cu
  WHERE ((cu.community_id = community_share_request.community_id) AND (cu.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid) AND (cu.role = ANY (ARRAY['owner'::text, 'community_admin'::text])))))));


--
-- Name: community_user Users can access their own community entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can access their own community entries" ON public.community_user FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


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
-- Name: share_library Users can access their own share library entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can access their own share library entries" ON public.share_library FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


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
-- Name: share_library Users can delete from their own share library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete from their own share library" ON public.share_library FOR DELETE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


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
-- Name: share_library Users can update their own share library entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own share library entries" ON public.share_library FOR UPDATE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)) WITH CHECK ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: user_library Users can update their own user library entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own user library entries" ON public.user_library FOR UPDATE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)) WITH CHECK ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: community; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community ENABLE ROW LEVEL SECURITY;

--
-- Name: community_event; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_event ENABLE ROW LEVEL SECURITY;

--
-- Name: community_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_library ENABLE ROW LEVEL SECURITY;

--
-- Name: community_library community_library_delete_own_entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY community_library_delete_own_entries ON public.community_library FOR DELETE TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: community_library community_library_insert_own_entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY community_library_insert_own_entries ON public.community_library FOR INSERT TO authenticated WITH CHECK ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: community_library community_library_select_own_entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY community_library_select_own_entries ON public.community_library FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));


--
-- Name: community_playlist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_playlist ENABLE ROW LEVEL SECURITY;

--
-- Name: community_public; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_public ENABLE ROW LEVEL SECURITY;

--
-- Name: community_share_request; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_share_request ENABLE ROW LEVEL SECURITY;

--
-- Name: community_song; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_song ENABLE ROW LEVEL SECURITY;

--
-- Name: community_tag; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_tag ENABLE ROW LEVEL SECURITY;

--
-- Name: community_user; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_user ENABLE ROW LEVEL SECURITY;

--
-- Name: community_user debug_all_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY debug_all_read ON public.community_user FOR SELECT TO authenticated USING (true);


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
-- Name: event_tag; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_tag ENABLE ROW LEVEL SECURITY;

--
-- Name: event_user; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_user ENABLE ROW LEVEL SECURITY;

--
-- Name: image; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.image ENABLE ROW LEVEL SECURITY;

--
-- Name: image_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.image_library ENABLE ROW LEVEL SECURITY;

--
-- Name: image_public; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.image_public ENABLE ROW LEVEL SECURITY;

--
-- Name: image_tag; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.image_tag ENABLE ROW LEVEL SECURITY;

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
-- Name: playlist_tag; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.playlist_tag ENABLE ROW LEVEL SECURITY;

--
-- Name: share; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.share ENABLE ROW LEVEL SECURITY;

--
-- Name: share_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.share_library ENABLE ROW LEVEL SECURITY;

--
-- Name: share_public; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.share_public ENABLE ROW LEVEL SECURITY;

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
-- Name: song_tag; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.song_tag ENABLE ROW LEVEL SECURITY;

--
-- Name: tag; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tag ENABLE ROW LEVEL SECURITY;

--
-- Name: tag_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tag_library ENABLE ROW LEVEL SECURITY;

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

\unrestrict NSUrIFc73dVdwKiaTmg4OkpJ9RHPVYWlxcrZtzhid27fqqV9s7D3pr3nE8cq34K

