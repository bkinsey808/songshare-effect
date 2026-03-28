-- Reconcile event-related tables in the Supabase Realtime publication.
-- Staging drifted so only public.event_tag remained in supabase_realtime.
-- This migration is idempotent and safe to run repeatedly.

ALTER TABLE public.event_public REPLICA IDENTITY FULL;
ALTER TABLE public.event_user REPLICA IDENTITY FULL;
ALTER TABLE public.event_tag REPLICA IDENTITY FULL;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime'
			AND schemaname = 'public'
			AND tablename = 'event_public'
	) THEN
		ALTER PUBLICATION supabase_realtime ADD TABLE public.event_public;
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

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime'
			AND schemaname = 'public'
			AND tablename = 'event_tag'
	) THEN
		ALTER PUBLICATION supabase_realtime ADD TABLE public.event_tag;
	END IF;
END $$;
