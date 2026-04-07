import type { SongKey } from "@/shared/song/songKeyOptions";

const songKeysBySemitone: Readonly<Record<number, SongKey>> = {
	0: "C",
	1: "Db",
	2: "D",
	3: "Eb",
	4: "E",
	5: "F",
	6: "Gb",
	7: "G",
	8: "Ab",
	9: "A",
	10: "Bb",
	11: "B",
} as const;

export default songKeysBySemitone;
