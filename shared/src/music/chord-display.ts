import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chordDisplayMode";

const ROMAN_DEGREES = ["I", "#I", "bII", "II", "#II", "bIII", "III", "IV", "#IV", "bV", "V", "#V", "bVI", "VI", "#VI", "bVII", "VII"] as const;

type RomanDegree = (typeof ROMAN_DEGREES)[number];

type ParsedChordToken =
	| Readonly<{
			root: SongKey;
			rootType: "absolute";
			shapeCode: string;
	  }>
	| Readonly<{
			root: RomanDegree;
			rootType: "roman";
			shapeCode: string;
	  }>;

const CHORD_TOKEN_PATTERN = /\[([^[\]]+?)\]/g;
const OCTAVE_SEMITONE_COUNT = 12;

const rootSemitoneMap: Readonly<Record<SongKey, number>> = {
	"C": 0,
	"C#": 1,
	"Db": 1,
	"D": 2,
	"D#": 3,
	"Eb": 3,
	"E": 4,
	"F": 5,
	"F#": 6,
	"Gb": 6,
	"G": 7,
	"G#": 8,
	"Ab": 8,
	"A": 9,
	"A#": 10,
	"Bb": 10,
	"B": 11,
} as const;

const romanDegreeBySemitone: Readonly<Record<number, RomanDegree>> = {
	0: "I",
	1: "bII",
	2: "II",
	3: "bIII",
	4: "III",
	5: "IV",
	6: "#IV",
	7: "V",
	8: "bVI",
	9: "VI",
	10: "bVII",
	11: "VII",
} as const;

const absoluteRootByRomanDegree: Readonly<Record<RomanDegree, SongKey>> = { "I": "C", "#I": "C#", bII: "Db", II: "D", "#II": "D#", bIII: "Eb", III: "E", IV: "F", "#IV": "F#", bV: "Gb", "V": "G", "#V": "G#", bVI: "Ab", VI: "A", "#VI": "A#", bVII: "Bb", VII: "B" } as const;

const displayedRootByMode: Readonly<
	Record<
		Exclude<ChordDisplayModeType, "roman">,
		Readonly<Record<SongKey, string>>
	>
> = {
	letters: {
		"C": "C",
		"C#": "C♯",
		"Db": "D♭",
		"D": "D",
		"D#": "D♯",
		"Eb": "E♭",
		"E": "E",
		"F": "F",
		"F#": "F♯",
		"Gb": "G♭",
		"G": "G",
		"G#": "G♯",
		"Ab": "A♭",
		"A": "A",
		"A#": "A♯",
		"Bb": "B♭",
		"B": "B",
	},
	solfege: {
		"C": "Do",
		"C#": "Do♯",
		"Db": "Ré♭",
		"D": "Ré",
		"D#": "Ré♯",
		"Eb": "Mi♭",
		"E": "Mi",
		"F": "Fa",
		"F#": "Fa♯",
		"Gb": "Sol♭",
		"G": "Sol",
		"G#": "Sol♯",
		"Ab": "La♭",
		"A": "La",
		"A#": "La♯",
		"Bb": "Si♭",
		"B": "Si",
	},
	indian: {
		"C": "S",
		"C#": "S♯",
		"Db": "R♭",
		"D": "R",
		"D#": "R♯",
		"Eb": "G♭",
		"E": "G",
		"F": "M",
		"F#": "M♯",
		"Gb": "P♭",
		"G": "P",
		"G#": "P♯",
		"Ab": "D♭",
		"A": "D",
		"A#": "D♯",
		"Bb": "N♭",
		"B": "N",
	},
	german: {
		"C": "C",
		"C#": "C♯",
		"Db": "D♭",
		"D": "D",
		"D#": "D♯",
		"Eb": "E♭",
		"E": "E",
		"F": "F",
		"F#": "F♯",
		"Gb": "G♭",
		"G": "G",
		"G#": "G♯",
		"Ab": "A♭",
		"A": "A",
		"A#": "A♯",
		"Bb": "B",
		"B": "H",
	},
} as const;

function parseChordTokenBody(tokenBody: string): ParsedChordToken | undefined {
	const trimmedBody = tokenBody.trim();
	if (trimmedBody === "") {
		return undefined;
	}

	const [rawRoot, ...rest] = trimmedBody.split(/\s+/g);
	if (!isSongKey(rawRoot) && !isRomanDegree(rawRoot)) {
		return undefined;
	}

	const shapeCode = rest.join(" ").trim();

	if (isSongKey(rawRoot)) {
		return {
			root: rawRoot,
			rootType: "absolute",
			shapeCode,
		};
	}

	return {
		root: rawRoot,
		rootType: "roman",
		shapeCode,
	};
}

function formatChordToken(token: ParsedChordToken): string {
	return token.shapeCode === "" ? `[${token.root}]` : `[${token.root} ${token.shapeCode}]`;
}

function transformChordTextForDisplay(
	text: string,
	params: Readonly<{
		chordDisplayMode: ChordDisplayModeType;
		songKey: SongKey | "" | null | undefined;
	}>,
): string {
	if (!text.includes("[")) {
		return text;
	}

	return text.replace(CHORD_TOKEN_PATTERN, (fullMatch, tokenBody: string) => {
		const parsed = parseChordTokenBody(tokenBody);
		if (parsed === undefined) {
			return fullMatch;
		}

		const displayedRoot = formatParsedChordRootForDisplay({
			token: parsed,
			chordDisplayMode: params.chordDisplayMode,
			songKey: params.songKey,
		});

		return parsed.shapeCode === ""
			? `[${displayedRoot}]`
			: `[${displayedRoot} ${parsed.shapeCode}]`;
	});
}

function formatParsedChordRootForDisplay({
	token,
	chordDisplayMode,
	songKey,
}: Readonly<{
	token: ParsedChordToken;
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | "" | null | undefined;
}>): string {
	if (token.rootType === "absolute") {
		const absoluteRoot = token.root;
		return formatChordRootForDisplay({
			root: absoluteRoot,
			chordDisplayMode,
			songKey,
		});
	}

	const romanRoot = token.root;

	if (chordDisplayMode === "roman") {
		return romanRoot;
	}

	const absoluteRoot = getAbsoluteRootFromRomanDegree(romanRoot, songKey);
	if (absoluteRoot === undefined) {
		return romanRoot;
	}

	return formatChordRootForDisplay({
		root: absoluteRoot,
		chordDisplayMode,
		songKey,
	});
}

function formatChordRootForDisplay({
	root,
	chordDisplayMode,
	songKey,
}: Readonly<{
	root: SongKey;
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | "" | null | undefined;
}>): string {
	if (chordDisplayMode === "roman") {
		return formatRomanDegree(root, songKey);
	}

	return displayedRootByMode[chordDisplayMode][root];
}

function formatRomanDegree(root: SongKey, songKey: SongKey | "" | null | undefined): string {
	if (!isSongKey(songKey)) {
		return displayedRootByMode.letters[root];
	}

	const rootSemitone = rootSemitoneMap[root];
	const tonicSemitone = rootSemitoneMap[songKey];
	const relativeSemitone =
		(rootSemitone - tonicSemitone + OCTAVE_SEMITONE_COUNT) % OCTAVE_SEMITONE_COUNT;

	return romanDegreeBySemitone[relativeSemitone] ?? displayedRootByMode.letters[root];
}

function getAbsoluteRootFromRomanDegree(
	romanDegree: RomanDegree,
	songKey: SongKey | "" | null | undefined,
): SongKey | undefined {
	const relativeRoot = absoluteRootByRomanDegree[romanDegree];
	if (!isSongKey(songKey)) {
		return undefined;
	}

	const tonicSemitone = rootSemitoneMap[songKey];
	const relativeSemitone = rootSemitoneMap[relativeRoot];
	const absoluteSemitone = (tonicSemitone + relativeSemitone) % OCTAVE_SEMITONE_COUNT;

	return songKeysBySemitone[absoluteSemitone];
}

function getRomanDegreeForStorage(
	root: SongKey,
	songKey: SongKey | "" | null | undefined,
): RomanDegree | undefined {
	if (!isSongKey(songKey)) {
		return undefined;
	}

	const romanDegree = formatRomanDegree(root, songKey);
	return isRomanDegree(romanDegree) ? romanDegree : undefined;
}

function formatStoredChordToken({
	root,
	rootType,
	shapeCode,
	songKey,
}:
	| Readonly<{
			root: RomanDegree;
			rootType: "roman";
			shapeCode: string;
			songKey: SongKey | "" | null | undefined;
	  }>
	| Readonly<{
			root: SongKey;
			rootType: "absolute";
			shapeCode: string;
			songKey: SongKey | "" | null | undefined;
	  }>): string {
	if (rootType === "roman") {
		const romanRoot = root;
		if (isSongKey(songKey)) {
			return formatChordToken({
				root: romanRoot,
				rootType: "roman",
				shapeCode,
			});
		}

		const absoluteRoot = absoluteRootByRomanDegree[romanRoot];
		return formatChordToken({
			root: absoluteRoot,
			rootType: "absolute",
			shapeCode,
		});
	}

	const absoluteRoot = root;
	const storedRomanDegree = getRomanDegreeForStorage(root, songKey);
	if (storedRomanDegree !== undefined) {
		return formatChordToken({
			root: storedRomanDegree,
			rootType: "roman",
			shapeCode,
		});
	}

	return formatChordToken({
		root: absoluteRoot,
		rootType: "absolute",
		shapeCode,
	});
}

const romanDegreeSet = new Set<string>(ROMAN_DEGREES);

const songKeysBySemitone: Readonly<Record<number, SongKey>> = {
	0: "C",
	1: "Db",
	2: "D",
	3: "Eb",
	4: "E",
	5: "F",
	6: "F#",
	7: "G",
	8: "Ab",
	9: "A",
	10: "Bb",
	11: "B",
} as const;

function isRomanDegree(value: unknown): value is RomanDegree {
	return typeof value === "string" && romanDegreeSet.has(value);
}

export {
	formatChordRootForDisplay,
	formatChordToken,
	formatStoredChordToken,
	getAbsoluteRootFromRomanDegree,
	getRomanDegreeForStorage,
	parseChordTokenBody,
	transformChordTextForDisplay,
};

export type { ParsedChordToken, RomanDegree };
