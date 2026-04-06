import getAbsoluteRootFromRomanDegree from "@/shared/music/chord-display/getAbsoluteRootFromRomanDegree";
import type { SongKey } from "@/shared/song/songKeyOptions";

import type { SelectedRoot } from "../root-picker/chordPickerRootOptionTypes";

/**
 * Resolves a SelectedRoot to an absolute SongKey.
 * For absolute roots the value is returned directly; roman-numeral roots are
 * converted relative to the given song key.
 *
 * @param selectedRoot - The currently selected root (absolute or roman-numeral)
 * @param songKey - The song key used for roman-numeral conversion
 * @returns The resolved absolute root, or undefined when conversion is not possible
 */
export default function getAbsoluteSelectedRoot(
	selectedRoot: SelectedRoot,
	songKey: SongKey | "",
): SongKey | undefined {
	if (selectedRoot.rootType === "absolute") {
		return selectedRoot.root;
	}

	return getAbsoluteRootFromRomanDegree(selectedRoot.root, songKey);
}
