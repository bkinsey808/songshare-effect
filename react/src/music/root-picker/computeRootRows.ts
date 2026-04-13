import formatRootOptionLabel from "@/react/music/root-picker/formatRootOptionLabel";
import getAbsoluteRootFromRomanDegree from "@/shared/music/chord-display/getAbsoluteRootFromRomanDegree";
import type {
	AbsoluteSelectedRoot,
	AnySelectedRoot,
	RomanSelectedRoot,
	SelectedRoot,
} from "@/react/music/root-picker/selected-root.type";
import formatChordRootForDisplay from "@/shared/music/chord-display/formatChordRootForDisplay";
import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

type AbsoluteRootOptionRow = Readonly<{
	primary: AbsoluteSelectedRoot;
	secondary?: AbsoluteSelectedRoot;
}>;

type RomanRootOptionRow = Readonly<{
	primary: RomanSelectedRoot;
	secondary?: RomanSelectedRoot;
}>;

/** Groups one or two root options so enharmonic spellings can render on the same row. */
type RootOptionRow = Readonly<{
	primary: SelectedRoot;
	secondary?: SelectedRoot;
}>;

const ANY_ROOT = "any" as const;

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

function formatRomanRootOptionLabel(root: RomanSelectedRoot["root"], songKey: SongKey | ""): string {
	const romanLabel = formatRootOptionLabel(root);
	if (songKey === "") {
		return romanLabel;
	}

	const absoluteRoot = getAbsoluteRootFromRomanDegree(root, songKey);
	if (absoluteRoot === undefined) {
		return romanLabel;
	}

	const letterLabel = formatChordRootForDisplay({
		root: absoluteRoot,
		chordDisplayMode: "letters",
		songKey,
	});
	return `${romanLabel} (${letterLabel})`;
}

/**
 * Builds the selectable root rows for the current display mode.
 *
 * @param includeAnyRoot - Whether to prepend an "Any" root option
 * @param anyLabel - Localized label for the Any option
 * @param chordDisplayMode - Active chord display mode for the picker
 * @param songKey - Current song key used to format absolute roots
 * @returns Root option rows for the picker popover
 */
export default function computeRootRows({
	includeAnyRoot = false,
	anyLabel = "Any",
	chordDisplayMode,
	songKey,
}: Readonly<{
	includeAnyRoot?: boolean;
	anyLabel?: string;
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | "";
}>): readonly RootOptionRow[] {
	const anyRow: RootOptionRow | undefined = includeAnyRoot
		? ({
				primary: {
					root: ANY_ROOT,
					rootType: "any",
					label: anyLabel,
				} satisfies AnySelectedRoot,
			} as const)
		: undefined;

	if (chordDisplayMode === "roman") {
		const romanRows = ROMAN_ROOT_ROWS.map((row) => {
			const primary: RomanSelectedRoot = {
				root: row.primary.root,
				rootType: row.primary.rootType,
				label: formatRomanRootOptionLabel(row.primary.root, songKey),
			};

			if (row.secondary === undefined) {
				return { primary };
			}

			const secondary: RomanSelectedRoot = {
				root: row.secondary.root,
				rootType: row.secondary.rootType,
				label: formatRomanRootOptionLabel(row.secondary.root, songKey),
			};

			return {
				primary,
				secondary,
			};
		});

		return anyRow === undefined ? romanRows : [anyRow, ...romanRows];
	}

	const absoluteRows = ABSOLUTE_ROOT_ROWS.map((row) => {
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

	return anyRow === undefined ? absoluteRows : [anyRow, ...absoluteRows];
}
