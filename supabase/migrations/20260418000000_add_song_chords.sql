-- Add chords array to song_public.
-- Date: 2026-04-18
--
-- Stores the ordered list of chord tokens available for use in the song's
-- ChordSelect pulldown. Replaces dynamic chord extraction from lyrics text.
-- Each element is a chord token string such as "[C -]" or "[G 7]".

BEGIN;

ALTER TABLE public.song_public
  ADD COLUMN IF NOT EXISTS chords text[] NOT NULL DEFAULT '{}';

COMMIT;
