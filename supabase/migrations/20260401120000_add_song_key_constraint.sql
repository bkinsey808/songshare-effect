ALTER TABLE public.song_public
ADD COLUMN IF NOT EXISTS key text;

UPDATE public.song_public
SET key = NULL
WHERE key IS NOT NULL
	AND key <> ALL (ARRAY['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']);

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'song_public_key_allowed_values'
			AND conrelid = 'public.song_public'::regclass
	) THEN
		ALTER TABLE public.song_public
		ADD CONSTRAINT song_public_key_allowed_values
		CHECK (
			key IS NULL
			OR key = ANY (ARRAY['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'])
		);
	END IF;
END $$;
