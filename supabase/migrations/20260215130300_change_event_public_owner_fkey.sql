-- Migration: Change event_public.owner_id FK to reference user_public instead of user
-- Date: 2026-02-15 13:03:00
-- Description: Drops the existing FK from event_public.owner_id to user.user_id
-- and adds a new FK to user_public.user_id instead. This enables PostgREST to
-- follow the join path for fetching owner usernames directly.

-- Drop the existing FK to user table
ALTER TABLE ONLY public.event_public
    DROP CONSTRAINT IF EXISTS event_public_owner_id_fkey;

-- Add new FK to user_public table
ALTER TABLE ONLY public.event_public
    ADD CONSTRAINT event_public_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.user_public(user_id) ON DELETE CASCADE;

COMMENT ON CONSTRAINT event_public_owner_id_fkey ON public.event_public IS
'References the owner in user_public table. Enables PostgREST joins for fetching owner data.';
