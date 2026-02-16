-- Migration: Add foreign key constraint for event_library.event_owner_id
-- Date: 2026-02-15 13:01:00
-- Description: Adds a foreign key constraint from event_library.event_owner_id
-- to user.user_id to ensure referential integrity.

ALTER TABLE ONLY public.event_library
    ADD CONSTRAINT event_library_event_owner_id_fkey
    FOREIGN KEY (event_owner_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

COMMENT ON CONSTRAINT event_library_event_owner_id_fkey ON public.event_library IS
'Ensures event_owner_id references a valid user. Cascades deletion if the owner is deleted.';
