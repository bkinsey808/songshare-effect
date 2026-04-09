import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import songKeysBySemitone from "@/shared/music/chord-display/songKeysBySemitone";
import type { ChordShape } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";

import computeShapeAfterNoteToggle from "@/react/music/intervals/computeShapeAfterNoteToggle";
import { OCTAVE_SEMITONE_COUNT } from "@/react/music/intervals/interval-constants";
import type { SciInversion } from "@/react/music/inversions/computeSciInversions";
import findShapeByInversion from "@/react/music/inversions/findShapeByInversion";
import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";

const ROOT_SEMITONE_OFFSET = 0;
/** Synthetic shapes produced by computeShapeAfterNoteToggle always use id=0; catalog shapes use positive ids. */
const SYNTHETIC_CHORD_ID = 0;
/** Root counts as one note in addition to the non-root intervals in a spelling. */
const ROOT_NOTE_COUNT = 1;

type CreateNoteToggleHandlerParams = Readonly<{
	activeInversion: SciInversion | undefined;
	notePickerShape: ChordShape | undefined;
	notePickerRoot: SongKey | undefined;
	absoluteRoot: SongKey | undefined;
	clearInversion: () => void;
	setSelectedRoot: (root: SelectedRoot) => void;
	setSelectedShapeCode: (shapeCode: string) => void;
	selectBassNote: (note: SongKey) => void;
}>;

/**
 * Returns a handler that toggles a non-root note interval in or out of the selected chord shape.
 *
 * 1. Direct catalog match → select that shape.
 * 2. Inversion match → re-root to the catalog shape's root and set the original root as bass
 *    (produces a slash chord token).
 * 3. No catalog or inversion match → use a synthetic shape with the spelling as its code
 *    so the note picker reflects the current selection even without a named chord.
 *
 * When an inversion card is active the toggle works in the bass-note (display root) frame
 * so the note picker stays anchored — only the clicked note appears to change, not the
 * entire perspective.
 */
export default function createNoteToggleHandler({
	activeInversion,
	notePickerShape,
	notePickerRoot,
	absoluteRoot,
	clearInversion,
	setSelectedRoot,
	setSelectedShapeCode,
	selectBassNote,
}: CreateNoteToggleHandlerParams): (semitoneOffset: number) => void {
	return function handleNoteToggle(semitoneOffset: number): void {
		// Offset 0 is always the displayed root (chord root or bass note) and is never toggleable.
		if (semitoneOffset === ROOT_SEMITONE_OFFSET) {
			return;
		}

		// When an inversion card is active, build a temporary working shape from the re-rooted
		// spelling (bass-note frame) instead of the base shape (chord-root frame). This ensures
		// the toggled interval corresponds exactly to what the user sees and that the note
		// picker stays anchored to the bass note after the operation.
		const isInversionActive = activeInversion !== undefined;
		const workingShape = isInversionActive
			? ({
					id: 0,
					name: activeInversion.reRootedSpelling,
					code: activeInversion.reRootedSpelling,
					prefer: false,
					noteCount: activeInversion.reRootedSpelling.split(",").length + ROOT_NOTE_COUNT,
					spelling: activeInversion.reRootedSpelling,
					ordering: 0,
					intervalForm: "",
					altNames: "",
					searchText: activeInversion.reRootedSpelling,
				} as const)
			: notePickerShape;

		const toggleResult = computeShapeAfterNoteToggle({
			selectedShape: workingShape,
			semitoneOffset,
		});
		if (toggleResult === undefined) {
			return;
		}

		// The reference root for inversion matching is always the display root — the note
		// picker's anchor note (bass note when inversion active, chord root otherwise).
		const referenceRoot = notePickerRoot;

		// Synthetic shapes created by computeShapeAfterNoteToggle always have id=0.
		// Real catalog shapes always have a positive id.
		if (toggleResult.id === SYNTHETIC_CHORD_ID && referenceRoot !== undefined) {
			const inversionMatch = findShapeByInversion(toggleResult.spelling);
			if (inversionMatch !== undefined) {
				const newRootSemitone =
					(rootSemitoneMap[referenceRoot] + inversionMatch.inversionRootOffset) %
					OCTAVE_SEMITONE_COUNT;
				const newAbsoluteRoot = songKeysBySemitone[newRootSemitone];
				if (newAbsoluteRoot !== undefined) {
					clearInversion();
					setSelectedRoot({
						root: newAbsoluteRoot,
						rootType: "absolute",
						label: newAbsoluteRoot,
					});
					setSelectedShapeCode(inversionMatch.shape.code);
					selectBassNote(referenceRoot);
					return;
				}
			}
		}

		// Catalog match or no inversion match:
		// When an inversion was active, promote the display root (bass note) to chord root
		// so the note picker perspective stays anchored after the toggle.
		clearInversion();
		if (isInversionActive && referenceRoot !== undefined && referenceRoot !== absoluteRoot) {
			setSelectedRoot({ root: referenceRoot, rootType: "absolute", label: referenceRoot });
		}
		setSelectedShapeCode(toggleResult.code);
	};
}
