-- Rename community_public.name → community_name and community_public.slug → community_slug
-- to match the naming pattern used by event_public (event_name, event_slug),
-- song_public (song_name, song_slug), etc.
--
-- PostgreSQL automatically rewrites CHECK constraint expressions when a column
-- is renamed, so community_name_format and community_slug_format will continue
-- to work against the new column names without any manual intervention.
--
-- The community_slug_unique UNIQUE constraint is similarly updated automatically.

ALTER TABLE public.community_public RENAME COLUMN name TO community_name;
ALTER TABLE public.community_public RENAME COLUMN slug TO community_slug;
