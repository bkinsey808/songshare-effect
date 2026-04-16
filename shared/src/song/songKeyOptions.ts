import type { Database } from "@/shared/generated/supabaseTypes";

type SongKey = Exclude<Database["public"]["Tables"]["song_public"]["Row"]["key"], null>;

const songKeys: readonly SongKey[] = [
	"C",
	"C#",
	"Db",
	"D",
	"D#",
	"Eb",
	"E",
	"F",
	"F#",
	"Gb",
	"G",
	"G#",
	"Ab",
	"A",
	"A#",
	"Bb",
	"B",
] as const satisfies readonly SongKey[];

const songKeySet = new Set<string>(songKeys);

/**
 * Type guard that verifies a value is a valid SongKey.
 *
 * @param value - Value to test
 * @returns True when the value is a recognized song key
 */
function isSongKey(value: unknown): value is SongKey {
	return typeof value === "string" && songKeySet.has(value);
}

export { isSongKey, songKeys };
export type { SongKey };

