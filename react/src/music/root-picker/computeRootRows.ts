import formatChordRootForDisplay from "@/shared/music/chord-display/formatChordRootForDisplay";
import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import type { AbsoluteSelectedRoot } from "@/react/music/root-picker/AbsoluteSelectedRoot.type";
import { ABSOLUTE_ROOT_ROWS, ROMAN_ROOT_ROWS } from "@/react/music/root-picker/sciPickerRootRows";
import formatRootOptionLabel from "@/react/music/root-picker/formatRootOptionLabel";
import type { RomanSelectedRoot } from "@/react/music/root-picker/RomanSelectedRoot.type";
import type { RootOptionRow } from "@/react/music/root-picker/RootOptionRow.type";

/**
 * Builds the selectable root rows for the current display mode.
 *
 * @param chordDisplayMode - Active chord display mode for the picker
 * @param songKey - Current song key used to format absolute roots
 * @returns Root option rows for the picker popover
 */
export default function computeRootRows({
	chordDisplayMode,
	songKey,
}: Readonly<{
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | "";
}>): readonly RootOptionRow[] {
	if (chordDisplayMode === "roman") {
		return ROMAN_ROOT_ROWS.map((row) => {
			const primary: RomanSelectedRoot = {
				root: row.primary.root,
				rootType: row.primary.rootType,
				label: formatRootOptionLabel(row.primary.label),
			};

			if (row.secondary === undefined) {
				return { primary };
			}

			const secondary: RomanSelectedRoot = {
				root: row.secondary.root,
				rootType: row.secondary.rootType,
				label: formatRootOptionLabel(row.secondary.label),
			};

			return {
				primary,
				secondary,
			};
		});
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
