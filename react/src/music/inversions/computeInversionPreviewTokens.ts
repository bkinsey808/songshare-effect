import transformChordTextForDisplay from "@/shared/music/chord-display/transformChordTextForDisplay";
import type { ChordShape } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import type { SelectedRoot } from "@/react/music/root-picker/SelectedRoot.type";
import computeCanonicalRootAndShape from "@/react/music/sci/computeCanonicalRootAndShape";
import computeCanonicalToken from "@/react/music/sci/computeCanonicalToken";
import type { SciInversion } from "@/react/music/inversions/computeSciInversions";

/**
 * Computes a display preview token for each inversion.
 *
 * Each token shows what the chord would look like in the current display mode
 * (letter or scale degree) if that inversion were selected. Uses the original
 * chord shape before any inversion was applied so results remain stable.
 *
 * @param inversions - The inversions to compute tokens for
 * @param selectedRoot - The original chord root (before any inversion)
 * @param inversionBaseShape - The original chord shape (before any inversion)
 * @param songKey - Song key for scale degree display, or empty string
 * @param chordDisplayMode - Current display mode
 * @returns Map of bassRoot SongKey to formatted display string
 */
export default function computeInversionPreviewTokens({
	inversions,
	selectedRoot,
	inversionBaseShape,
	songKey,
	chordDisplayMode,
}: Readonly<{
	inversions: readonly SciInversion[];
	selectedRoot: SelectedRoot;
	inversionBaseShape: ChordShape | undefined;
	songKey: SongKey | "";
	chordDisplayMode: ChordDisplayModeType;
}>): ReadonlyMap<SongKey, string> {
	return new Map(
		inversions.map((inv) => {
			const { root: invRoot, shapeCode: invShapeCode } = computeCanonicalRootAndShape({
				selectedRoot,
				selectedShape: inversionBaseShape,
				selectedBassNote: inv.bassRoot,
				activeInversion: inv,
			});
			const token = computeCanonicalToken({
				selectedRoot: invRoot,
				selectedShapeCode: invShapeCode,
				songKey,
			});
			const preview =
				token === undefined
					? ""
					: transformChordTextForDisplay(token, { chordDisplayMode, songKey });
			return [inv.bassRoot, preview] as [SongKey, string];
		}),
	);
}
