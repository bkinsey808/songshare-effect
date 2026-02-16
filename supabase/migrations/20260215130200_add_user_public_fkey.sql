-- Migration: Add foreign key constraint for user_public.user_id
-- Date: 2026-02-15 13:02:00
-- Description: Adds a foreign key constraint from user_public.user_id
-- to user.user_id to ensure referential integrity and enable PostgREST joins.

ALTER TABLE ONLY public.user_public
    ADD CONSTRAINT user_public_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

COMMENT ON CONSTRAINT user_public_user_id_fkey ON public.user_public IS
'Ensures user_public.user_id references a valid user. Cascades deletion if the user is deleted.';
