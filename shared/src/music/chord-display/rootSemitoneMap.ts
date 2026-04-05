import type { SongKey } from "@/shared/song/songKeyOptions";

const rootSemitoneMap: Readonly<Record<SongKey, number>> = {
	"A": 9,
	"A#": 10,
	"Ab": 8,
	"B": 11,
	"Bb": 10,
	"C": 0,
	"C#": 1,
	"D": 2,
	"D#": 3,
	"Db": 1,
	"E": 4,
	"Eb": 3,
	"F": 5,
	"F#": 6,
	"G": 7,
	"G#": 8,
	"Gb": 6,
} as const;

export default rootSemitoneMap;
