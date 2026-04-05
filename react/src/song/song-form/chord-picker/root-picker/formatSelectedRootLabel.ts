import formatChordRootForDisplay from "@/shared/music/chord-display/formatChordRootForDisplay";
import getAbsoluteRootFromRomanDegree from "@/shared/music/chord-display/getAbsoluteRootFromRomanDegree";
import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import formatRootOptionLabel from "./formatRootOptionLabel";
import type { SelectedRoot } from "./chordPickerRootOptionTypes";

/**
 * Formats the currently selected root for the collapsed picker button label.
 *
 * @param selectedRoot - Current root selection
 * @param chordDisplayMode - Active chord display mode for display formatting
 * @param songKey - Current song key for roman-degree conversion
 * @returns Human-readable label for the selected root
 */
export default function formatSelectedRootLabel({
	selectedRoot,
	chordDisplayMode,
	songKey,
}: Readonly<{
	selectedRoot: SelectedRoot;
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | "";
}>): string {
	if (selectedRoot.rootType === "roman") {
		if (chordDisplayMode === "roman") {
			return formatRootOptionLabel(selectedRoot.root);
		}

		const absoluteRoot = getAbsoluteRootFromRomanDegree(selectedRoot.root, songKey);
		if (absoluteRoot !== undefined) {
			return formatChordRootForDisplay({
				root: absoluteRoot,
				chordDisplayMode,
				songKey,
			});
		}

		return formatRootOptionLabel(selectedRoot.root);
	}

	return formatChordRootForDisplay({
		root: selectedRoot.root,
		chordDisplayMode,
		songKey,
	});
}
