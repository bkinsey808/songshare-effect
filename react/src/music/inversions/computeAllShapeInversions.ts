import computeInversionPreviewTokens from "@/react/music/inversions/computeInversionPreviewTokens";
import computeSciInversions from "@/react/music/inversions/computeSciInversions";
import type {
	DirectShapeOrdinal,
	ShapeInversion,
} from "@/react/music/inversions/shape-inversion.type";
import computeNoteSearchRoot from "@/react/music/note-picker/computeNoteSearchRoot";
import filterShapeByNoteSearch from "@/react/music/note-picker/filterShapeByNoteSearch";
import filterSpellingByNoteSearch from "@/react/music/note-picker/filterSpellingByNoteSearch";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";
import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";
import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import { searchChordShapes, type ChordShape } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

const FALLBACK_SEMITONE = 0;

type ComputeAllShapeInversionsResult = Readonly<{
	inversions: readonly ShapeInversion[];
	directShapeOrdinals: ReadonlyMap<string, DirectShapeOrdinal>;
}>;

type ComputeAllShapeInversionsParams = Readonly<{
	deferredIncludeInversions: boolean;
	query: string;
	minNotes: number;
	maxNotes: number;
	noteSearchState: ReadonlyMap<number, NoteSearchToggleState>;
	displayedShapes: readonly ChordShape[];
	songKey: SongKey | "";
	chordDisplayMode: ChordDisplayModeType;
}>;

/**
 * Derives the list of inversion results for the chord picker search grid.
 *
 * For each preferred shape matching the note search, finds all inversions that also satisfy
 * the note search, deduplicates against direct shape results, and computes display tokens.
 * Shapes that are both a direct result and an inversion are tracked in `directShapeOrdinals`
 * so the direct result card can show the ordinal badge and inversion label.
 *
 * @returns inversions for the inversion cards plus ordinal info for augmenting direct result cards.
 */
export default function computeAllShapeInversions({
	deferredIncludeInversions,
	query,
	minNotes,
	maxNotes,
	noteSearchState,
	displayedShapes,
	songKey,
	chordDisplayMode,
}: ComputeAllShapeInversionsParams): ComputeAllShapeInversionsResult {
	if (!deferredIncludeInversions) {
		return { inversions: [], directShapeOrdinals: new Map() };
	}
	const displayedShapeCodeSet = new Set(displayedShapes.map((shape) => shape.code));
	const DEFAULT_INVERSION_ROOT: SongKey = "C";
	const inversionRoot: SongKey = songKey === "" ? DEFAULT_INVERSION_ROOT : songKey;

	const inversions: ShapeInversion[] = [];
	const directShapeOrdinals = new Map<string, DirectShapeOrdinal>();

	for (const shape of searchChordShapes({ query, minNotes, maxNotes })
		.filter((shape) => shape.prefer)
		.filter((shape) => filterShapeByNoteSearch(shape, noteSearchState))) {
		const shapeRoot = computeNoteSearchRoot(shape.spelling, noteSearchState) ?? inversionRoot;
		const invSelectedRoot: SelectedRoot = {
			root: shapeRoot,
			rootType: "absolute",
			label: shapeRoot,
		};
		const allMatchingInversions = computeSciInversions(shapeRoot, shape.code).filter((inv) => {
			const bassRootSemitone = rootSemitoneMap[inv.bassRoot] ?? FALLBACK_SEMITONE;
			return filterSpellingByNoteSearch(inv.reRootedSpelling, bassRootSemitone, noteSearchState);
		});

		const nonDuplicates = allMatchingInversions.filter(
			(inv) => inv.matchedShape === undefined || !displayedShapeCodeSet.has(inv.matchedShape.code),
		);
		const previewTokens = computeInversionPreviewTokens({
			inversions: nonDuplicates,
			selectedRoot: invSelectedRoot,
			inversionBaseShape: shape,
			songKey,
			chordDisplayMode,
		});
		for (const inv of nonDuplicates) {
			inversions.push({
				inversion: inv,
				sourceShapeCode: shape.code,
				sourceShapeName: shape.name,
				displayToken: previewTokens.get(inv.bassRoot) ?? `${inv.originalRoot}/${inv.bassRoot}`,
			});
		}

		for (const inv of allMatchingInversions) {
			if (inv.matchedShape !== undefined && displayedShapeCodeSet.has(inv.matchedShape.code)) {
				directShapeOrdinals.set(inv.matchedShape.code, {
					ordinalLabel: inv.ordinalLabel,
					sourceShapeName: shape.name,
				});
			}
		}
	}

	return { inversions, directShapeOrdinals };
}
