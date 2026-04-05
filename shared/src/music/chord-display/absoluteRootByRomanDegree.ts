import type { SongKey } from "@/shared/song/songKeyOptions";

import type { RomanDegree } from "./RomanDegree.type";

const absoluteRootByRomanDegree: Readonly<Record<RomanDegree, SongKey>> = {
	"#I": "C#",
	"#II": "D#",
	"#IV": "F#",
	"#V": "G#",
	"#VI": "A#",
	"I": "C",
	"II": "D",
	"III": "E",
	"IV": "F",
	"V": "G",
	"VI": "A",
	"VII": "B",
	"bII": "Db",
	"bIII": "Eb",
	"bV": "Gb",
	"bVI": "Ab",
	"bVII": "Bb",
} as const;

export default absoluteRootByRomanDegree;
