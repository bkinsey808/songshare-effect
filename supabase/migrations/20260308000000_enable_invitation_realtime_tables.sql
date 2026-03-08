-- Ensure invitation membership tables are available to Supabase Realtime.
-- This migration is idempotent and safe to run repeatedly.

ALTER TABLE public.community_user REPLICA IDENTITY FULL;
ALTER TABLE public.event_user REPLICA IDENTITY FULL;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime'
			AND schemaname = 'public'
			AND tablename = 'community_user'
	) THEN
		ALTER PUBLICATION supabase_realtime ADD TABLE public.community_user;
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime'
			AND schemaname = 'public'
			AND tablename = 'event_user'
	) THEN
		ALTER PUBLICATION supabase_realtime ADD TABLE public.event_user;
	END IF;
END $$;
