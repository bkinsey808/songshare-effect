-- Drop denormalized *_owner_id columns from all library tables.
-- Owner information is now obtained via PostgREST joins to the corresponding
-- *_public tables, which carry the authoritative owner_id / user_id field.

-- song_library: drop song_owner_id
ALTER TABLE public.song_library
    DROP CONSTRAINT IF EXISTS song_library_song_owner_id_fkey;

ALTER TABLE public.song_library
    DROP COLUMN IF EXISTS song_owner_id;

-- playlist_library: drop playlist_owner_id
ALTER TABLE public.playlist_library
    DROP CONSTRAINT IF EXISTS playlist_library_playlist_owner_id_fkey;

ALTER TABLE public.playlist_library
    DROP COLUMN IF EXISTS playlist_owner_id;

-- event_library: drop event_owner_id
ALTER TABLE public.event_library
    DROP CONSTRAINT IF EXISTS event_library_event_owner_id_fkey;

ALTER TABLE public.event_library
    DROP COLUMN IF EXISTS event_owner_id;

-- image_library: drop image_owner_id
ALTER TABLE public.image_library
    DROP CONSTRAINT IF EXISTS image_library_image_owner_id_fkey;

ALTER TABLE public.image_library
    DROP COLUMN IF EXISTS image_owner_id;

-- community_library: drop community_owner_id (added by 20260321000000)
ALTER TABLE public.community_library
    DROP CONSTRAINT IF EXISTS community_library_community_owner_id_fkey;

ALTER TABLE public.community_library
    DROP COLUMN IF EXISTS community_owner_id;
