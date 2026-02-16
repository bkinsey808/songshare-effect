-- Migration: Add foreign key from event_library.event_id to event_public
-- Date: 2026-02-15 13:04:00
-- Description: Adds a foreign key constraint from event_library.event_id
-- to event_public.event_id to enable PostgREST joins for fetching event data.
-- This is in addition to the existing FK to event.event_id.

ALTER TABLE ONLY public.event_library
    ADD CONSTRAINT event_library_event_public_fkey
    FOREIGN KEY (event_id) REFERENCES public.event_public(event_id) ON DELETE CASCADE;

COMMENT ON CONSTRAINT event_library_event_public_fkey ON public.event_library IS
'Enables PostgREST to join event_library with event_public for fetching event data.';
