import {
	formatChordRootForDisplay,
	formatStoredChordToken,
	getAbsoluteRootFromRomanDegree,
	getRomanDegreeForStorage,
	parseChordTokenBody,
	type ParsedChordToken,
	type RomanDegree,
} from "@/shared/music/chord-display";
import {
	DEFAULT_MAX_CHORD_NOTES,
	getChordShapeByCode,
} from "@/shared/music/chord-shapes";
import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chordDisplayMode";

const DEFAULT_ROOT: SongKey = "C";
const DEFAULT_SHAPE_CODE = "M";
const TOKEN_BODY_START_INDEX = 1;
const TOKEN_BODY_END_OFFSET = -1;

type AbsoluteSelectedRoot = Readonly<{
	root: SongKey;
	rootType: "absolute";
	label: string;
}>;

type RomanSelectedRoot = Readonly<{
	root: RomanDegree;
	rootType: "roman";
	label: string;
}>;

type SelectedRoot = AbsoluteSelectedRoot | RomanSelectedRoot;

type RootOptionRow = Readonly<{
	primary: SelectedRoot;
	secondary?: SelectedRoot;
}>;

type AbsoluteRootOptionRow = Readonly<{
	primary: AbsoluteSelectedRoot;
	secondary?: AbsoluteSelectedRoot;
}>;

type RomanRootOptionRow = Readonly<{
	primary: RomanSelectedRoot;
	secondary?: RomanSelectedRoot;
}>;

const ABSOLUTE_ROOT_ROWS: readonly AbsoluteRootOptionRow[] = [
	{ primary: { root: "C", rootType: "absolute", label: "C" } },
	{
		primary: { root: "C#", rootType: "absolute", label: "C#" },
		secondary: { root: "Db", rootType: "absolute", label: "Db" },
	},
	{ primary: { root: "D", rootType: "absolute", label: "D" } },
	{
		primary: { root: "D#", rootType: "absolute", label: "D#" },
		secondary: { root: "Eb", rootType: "absolute", label: "Eb" },
	},
	{ primary: { root: "E", rootType: "absolute", label: "E" } },
	{ primary: { root: "F", rootType: "absolute", label: "F" } },
	{
		primary: { root: "F#", rootType: "absolute", label: "F#" },
		secondary: { root: "Gb", rootType: "absolute", label: "Gb" },
	},
	{ primary: { root: "G", rootType: "absolute", label: "G" } },
	{
		primary: { root: "G#", rootType: "absolute", label: "G#" },
		secondary: { root: "Ab", rootType: "absolute", label: "Ab" },
	},
	{ primary: { root: "A", rootType: "absolute", label: "A" } },
	{
		primary: { root: "A#", rootType: "absolute", label: "A#" },
		secondary: { root: "Bb", rootType: "absolute", label: "Bb" },
	},
	{ primary: { root: "B", rootType: "absolute", label: "B" } },
] as const;

const ROMAN_ROOT_ROWS: readonly RomanRootOptionRow[] = [
	{ primary: { root: "I", rootType: "roman", label: "I" } },
	{
		primary: { root: "#I", rootType: "roman", label: "#I" },
		secondary: { root: "bII", rootType: "roman", label: "bII" },
	},
	{ primary: { root: "II", rootType: "roman", label: "II" } },
	{
		primary: { root: "#II", rootType: "roman", label: "#II" },
		secondary: { root: "bIII", rootType: "roman", label: "bIII" },
	},
	{ primary: { root: "III", rootType: "roman", label: "III" } },
	{ primary: { root: "IV", rootType: "roman", label: "IV" } },
	{
		primary: { root: "#IV", rootType: "roman", label: "#IV" },
		secondary: { root: "bV", rootType: "roman", label: "bV" },
	},
	{ primary: { root: "V", rootType: "roman", label: "V" } },
	{
		primary: { root: "#V", rootType: "roman", label: "#V" },
		secondary: { root: "bVI", rootType: "roman", label: "bVI" },
	},
	{ primary: { root: "VI", rootType: "roman", label: "VI" } },
	{
		primary: { root: "#VI", rootType: "roman", label: "#VI" },
		secondary: { root: "bVII", rootType: "roman", label: "bVII" },
	},
	{ primary: { root: "VII", rootType: "roman", label: "VII" } },
] as const;

function getInitialSelectedRoot({
	chordDisplayMode,
	initialChordToken,
	songKey,
}: Readonly<{
	chordDisplayMode: ChordDisplayModeType;
	initialChordToken: string | undefined;
	songKey: SongKey | "";
}>): SelectedRoot {
	const parsedInitialToken = parseInitialChordToken(initialChordToken);
	const pickerSongKey = getPickerSongKey(songKey);

	if (parsedInitialToken !== undefined) {
		if (chordDisplayMode === "roman") {
			if (parsedInitialToken.rootType === "roman") {
				return {
					root: parsedInitialToken.root,
					rootType: "roman",
					label: parsedInitialToken.root,
				};
			}

			const romanRoot = getRomanDegreeForStorage(parsedInitialToken.root, pickerSongKey);
			if (romanRoot !== undefined) {
				return {
					root: romanRoot,
					rootType: "roman",
					label: romanRoot,
				};
			}
		}

		if (parsedInitialToken.rootType === "absolute") {
			return {
				root: parsedInitialToken.root,
				rootType: "absolute",
				label: parsedInitialToken.root,
			};
		}

		const absoluteRoot = getAbsoluteRootFromRomanDegree(parsedInitialToken.root, pickerSongKey);
		if (absoluteRoot !== undefined) {
			return {
				root: absoluteRoot,
				rootType: "absolute",
				label: absoluteRoot,
			};
		}
	}

	if (
		(chordDisplayMode === "letters" || chordDisplayMode === "roman") &&
		isSongKey(songKey)
	) {
		if (chordDisplayMode === "roman") {
			return {
				root: "I",
				rootType: "roman",
				label: "I",
			};
		}

		return {
			root: songKey,
			rootType: "absolute",
			label: songKey,
		};
	}

	if (chordDisplayMode === "roman") {
		return {
			root: "I",
			rootType: "roman",
			label: "I",
		};
	}

	return {
		root: DEFAULT_ROOT,
		rootType: "absolute",
		label: DEFAULT_ROOT,
	};
}

function getInitialShapeCode({
	initialChordToken,
}: Readonly<{
	initialChordToken: string | undefined;
}>): string {
	return parseInitialChordToken(initialChordToken)?.shapeCode ?? DEFAULT_SHAPE_CODE;
}

function getInitialMaxNotes({
	initialChordToken,
}: Readonly<{
	initialChordToken: string | undefined;
}>): number {
	if (initialChordToken === undefined) {
		return DEFAULT_MAX_CHORD_NOTES;
	}

	const shapeCode = getInitialShapeCode({ initialChordToken });
	return getChordShapeByCode(shapeCode)?.noteCount ?? DEFAULT_MAX_CHORD_NOTES;
}

function parseInitialChordToken(
	initialChordToken: string | undefined,
): ParsedChordToken | undefined {
	if (initialChordToken === undefined) {
		return undefined;
	}

	if (!initialChordToken.startsWith("[") || !initialChordToken.endsWith("]")) {
		return undefined;
	}

	return parseChordTokenBody(
		initialChordToken.slice(TOKEN_BODY_START_INDEX, TOKEN_BODY_END_OFFSET),
	);
}

function getPickerSongKey(songKey: SongKey | ""): SongKey {
	return isSongKey(songKey) ? songKey : DEFAULT_ROOT;
}

function getRootRows({
	chordDisplayMode,
	songKey,
}: Readonly<{
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | "";
}>): readonly RootOptionRow[] {
	if (chordDisplayMode === "roman") {
		return ROMAN_ROOT_ROWS;
	}

	return ABSOLUTE_ROOT_ROWS.map((row) => {
		const primary: AbsoluteSelectedRoot = {
			...row.primary,
			label: formatChordRootForDisplay({
				root: row.primary.root,
				chordDisplayMode,
				songKey,
			}),
		};

		if (row.secondary === undefined) {
			return { primary };
		}

		const secondary: AbsoluteSelectedRoot = {
			...row.secondary,
			label: formatChordRootForDisplay({
				root: row.secondary.root,
				chordDisplayMode,
				songKey,
			}),
		};

		return {
			primary,
			secondary,
		};
	});
}

function formatSelectedRootLabel({
	selectedRoot,
	chordDisplayMode,
	songKey,
}: Readonly<{
	selectedRoot: SelectedRoot;
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | "";
}>): string {
	if (selectedRoot.rootType === "roman") {
		return selectedRoot.root;
	}

	return formatChordRootForDisplay({
		root: selectedRoot.root,
		chordDisplayMode,
		songKey,
	});
}

function getCanonicalToken({
	selectedRoot,
	selectedShapeCode,
	songKey,
}: Readonly<{
	selectedRoot: SelectedRoot;
	selectedShapeCode: string | undefined;
	songKey: SongKey | "";
}>): string | undefined {
	if (selectedShapeCode === undefined) {
		return undefined;
	}

	if (selectedRoot.rootType === "roman") {
		return formatStoredChordToken({
			root: selectedRoot.root,
			rootType: "roman",
			shapeCode: selectedShapeCode,
			songKey,
		});
	}

	return formatStoredChordToken({
		root: selectedRoot.root,
		rootType: "absolute",
		shapeCode: selectedShapeCode,
		songKey,
	});
}

export {
	getCanonicalToken,
	getInitialMaxNotes,
	getInitialSelectedRoot,
	getInitialShapeCode,
	getRootRows,
	formatSelectedRootLabel,
};

export type { SelectedRoot, RootOptionRow };
