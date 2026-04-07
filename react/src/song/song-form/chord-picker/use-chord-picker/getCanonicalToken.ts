import formatStoredChordToken from "@/shared/music/chord-display/formatStoredChordToken";
import type { SongKey } from "@/shared/song/songKeyOptions";

import type { SelectedRoot } from "../root-picker/chordPickerRootOptionTypes";

/**
 * Converts the current picker selection into the canonical stored chord token.
 *
 * @param selectedRoot - Current root selection
 * @param selectedShapeCode - Chosen chord shape code
 * @param songKey - Current song key for roman-degree storage
 * @returns Canonical stored chord token, or undefined when the selection is incomplete
 */
export default function getCanonicalToken({
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

	// Synthetic shape codes use the spelling as the code (contains commas).
	// These have no catalog entry and cannot produce a valid stored token.
	if (selectedShapeCode.includes(",")) {
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
