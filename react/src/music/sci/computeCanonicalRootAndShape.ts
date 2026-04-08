import type { SongKey } from "@/shared/song/songKeyOptions";

import type { ChordShape } from "@/shared/music/chord-shapes";
import type { SciInversion } from "@/react/music/inversions/computeSciInversions";
import type { SelectedRoot } from "@/react/music/root-picker/SelectedRoot.type";

/**
 * Resolves the canonical root and shape code for the current picker selection.
 *
 * When an active inversion matches a known SCI shape, the token is stored as
 * `[bassNote matchedCode]` rather than slash notation for cleaner round-tripping.
 * When no SCI match exists, slash notation `[root shape/bassNote]` is used instead.
 *
 * @param selectedRoot - The original chord root selection
 * @param selectedShape - The currently selected chord shape, if any
 * @param selectedBassNote - The active inversion bass note, or undefined for root position
 * @param activeInversion - The matched inversion entry, or undefined when none is active
 * @returns Canonical root and shape code for token generation
 */
export default function computeCanonicalRootAndShape({
	selectedRoot,
	selectedShape,
	selectedBassNote,
	activeInversion,
}: Readonly<{
	selectedRoot: SelectedRoot;
	selectedShape: ChordShape | undefined;
	selectedBassNote: SongKey | undefined;
	activeInversion: SciInversion | undefined;
}>): Readonly<{ root: SelectedRoot; shapeCode: string | undefined }> {
	if (activeInversion?.matchedShape !== undefined && selectedBassNote !== undefined) {
		return {
			root: { root: selectedBassNote, rootType: "absolute", label: selectedBassNote },
			shapeCode: activeInversion.matchedShape.code,
		};
	}
	if (selectedShape !== undefined && selectedBassNote !== undefined) {
		return {
			root: selectedRoot,
			shapeCode: `${selectedShape.code}/${selectedBassNote}`,
		};
	}
	return { root: selectedRoot, shapeCode: selectedShape?.code };
}
