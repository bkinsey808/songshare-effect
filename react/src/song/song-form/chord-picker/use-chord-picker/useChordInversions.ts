import { useState } from "react";

import transformChordTextForDisplay from "@/shared/music/chord-display/transformChordTextForDisplay";
import { getChordShapeByCode, type ChordShape } from "@/shared/music/chord-shapes";
import { type SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import type { SelectedRoot } from "../root-picker/chordPickerRootOptionTypes";
import getAbsoluteSelectedRoot from "./getAbsoluteSelectedRoot";
import getCanonicalToken from "./getCanonicalToken";
import getChordInversions, { type ChordInversion } from "./getChordInversions";
import getInitialBassNote from "./getInitialBassNote";
import getInversionPreviewTokens from "./getInversionPreviewTokens";
import useSongKeyRootSync from "./useSongKeyRootSync";

type UseChordInversionsParams = Readonly<{
	selectedRoot: SelectedRoot;
	setSelectedRoot: (root: SelectedRoot) => void;
	selectedShapeCode: string;
	onShapeCodeChange: (shapeCode: string) => void;
	songKey: SongKey | "";
	chordDisplayMode: ChordDisplayModeType;
	initialChordToken: string | undefined;
}>;

type UseChordInversionsResult = Readonly<{
	selectedBassNote: SongKey | undefined;
	absoluteRoot: SongKey | undefined;
	activeInversion: ChordInversion | undefined;
	inversionBaseShape: ChordShape | undefined;
	inversionBaseShapeName: string;
	displayChordInversions: readonly ChordInversion[];
	displayInversionPreviewTokens: ReadonlyMap<SongKey, string>;
	slashPreviewTokens: ReadonlyMap<SongKey, string>;
	handleSelectInversion: (inversion: ChordInversion) => void;
	clearInversion: () => void;
	/** Sets the active bass note directly, used when note-picker toggling resolves to an inversion. */
	selectBassNote: (note: SongKey) => void;
}>;

/**
 * Manages inversion state and all derived display values for the chord picker.
 *
 * Encapsulates the bass-note and inversion-base-shape state, computes the
 * display inversion list (with root-position replacement when active), and
 * provides the select/deselect handler.
 *
 * @param selectedRoot - Current chord root selection
 * @param setSelectedRoot - Forwarded to useSongKeyRootSync for key-change conversion
 * @param selectedShapeCode - Currently selected chord shape code
 * @param onShapeCodeChange - Callback to change the active shape code
 * @param songKey - Current song key for display and roman-degree conversion
 * @param chordDisplayMode - Current display mode (letter or scale degree)
 * @param initialChordToken - Existing chord token when editing a chord
 * @returns Inversion state, derived display lists, handler, and clear helper
 */
export default function useChordInversions({
	selectedRoot,
	setSelectedRoot,
	selectedShapeCode,
	onShapeCodeChange,
	songKey,
	chordDisplayMode,
	initialChordToken,
}: UseChordInversionsParams): UseChordInversionsResult {
	// Remembers the shape code before an inversion is selected so it can be restored on deselect.
	const [inversionBaseShapeCode, setInversionBaseShapeCode] = useState<string | undefined>(
		undefined,
	);
	const [selectedBassNote, setSelectedBassNote] = useState<SongKey | undefined>(() =>
		getInitialBassNote({ initialChordToken }),
	);

	// When the song key is cleared, convert any selected roman root back to an absolute note.
	useSongKeyRootSync({
		selectedRoot,
		songKey,
		setSelectedRoot,
		setSelectedBassNote,
	});

	const absoluteRoot = getAbsoluteSelectedRoot(selectedRoot, songKey);
	const inversionBaseShape = getChordShapeByCode(inversionBaseShapeCode ?? selectedShapeCode);

	const chordInversions =
		absoluteRoot !== undefined && inversionBaseShape !== undefined
			? getChordInversions(absoluteRoot, inversionBaseShape.code)
			: [];
	const activeInversion =
		selectedBassNote === undefined
			? undefined
			: chordInversions.find((inv) => inv.bassRoot === selectedBassNote);

	const inversionPreviewTokens = getInversionPreviewTokens({
		inversions: chordInversions,
		selectedRoot,
		inversionBaseShape,
		songKey,
		chordDisplayMode,
	});

	// Slash-form tokens always use the original shape without SCI matching, used in the
	// inversion card subtitle to show e.g. "A -/C" when the heading shows "C I6".
	const slashPreviewTokens = getInversionPreviewTokens({
		inversions: chordInversions.map(({ matchedShape: _matchedShape, ...rest }) => rest),
		selectedRoot,
		inversionBaseShape,
		songKey,
		chordDisplayMode,
	});

	// When an inversion is active, replace its card with a root-position entry so the user
	// sees how to return to root position rather than the chord they already selected.
	// bassRoot === originalRoot distinguishes this synthetic entry from real inversions.
	const rootPositionEntry: ChordInversion | undefined =
		selectedBassNote === undefined || absoluteRoot === undefined || inversionBaseShape === undefined
			? undefined
			: {
					inversionNumber: 0,
					ordinalLabel: "Root",
					originalRoot: absoluteRoot,
					bassRoot: absoluteRoot,
					reRootedSpelling: inversionBaseShape.spelling,
					matchedShape: inversionBaseShape,
				};
	const displayChordInversions: readonly ChordInversion[] =
		rootPositionEntry === undefined
			? chordInversions
			: chordInversions.map((inv) => (inv.bassRoot === selectedBassNote ? rootPositionEntry : inv));
	const rootPositionPreviewToken: string | undefined = (() => {
		if (rootPositionEntry === undefined) {
			return undefined;
		}
		const token = getCanonicalToken({
			selectedRoot,
			selectedShapeCode: rootPositionEntry.matchedShape?.code,
			songKey,
		});
		return token === undefined
			? ""
			: transformChordTextForDisplay(token, { chordDisplayMode, songKey });
	})();
	const displayInversionPreviewTokens: ReadonlyMap<SongKey, string> = (() => {
		if (rootPositionPreviewToken === undefined || absoluteRoot === undefined) {
			return inversionPreviewTokens;
		}
		return new Map([...inversionPreviewTokens, [absoluteRoot, rootPositionPreviewToken]]);
	})();

	function clearInversion(): void {
		setSelectedBassNote(undefined);
		setInversionBaseShapeCode(undefined);
	}

	function selectBassNote(note: SongKey): void {
		setSelectedBassNote(note);
	}

	function handleSelectInversion(inversion: ChordInversion): void {
		// Deselect when clicking the active inversion again, or when clicking the root-position
		// entry (identified by bassRoot === originalRoot — synthetic entries only).
		if (selectedBassNote === inversion.bassRoot || inversion.bassRoot === inversion.originalRoot) {
			if (inversionBaseShapeCode !== undefined) {
				onShapeCodeChange(inversionBaseShapeCode);
			}
			clearInversion();
			return;
		}
		// Only capture the base shape code when starting from root position; if an inversion is
		// already active, the original base is already stored and must not be overwritten.
		const baseCode = inversionBaseShapeCode ?? selectedShapeCode;
		if (inversionBaseShapeCode === undefined) {
			setInversionBaseShapeCode(selectedShapeCode);
		}
		setSelectedBassNote(inversion.bassRoot);
		onShapeCodeChange(inversion.matchedShape?.code ?? baseCode);
	}

	return {
		selectedBassNote,
		absoluteRoot,
		activeInversion,
		inversionBaseShape,
		inversionBaseShapeName: inversionBaseShape?.name ?? "",
		displayChordInversions,
		displayInversionPreviewTokens,
		slashPreviewTokens,
		handleSelectInversion,
		clearInversion,
		selectBassNote,
	};
}
