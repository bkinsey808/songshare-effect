import { getChordShapeByCode, searchChordShapes, type ChordShape } from "@/shared/music/chord-shapes";

const FIRST_SHAPE_INDEX = 0;

/**
 * Derives the ordered shape list and currently selected shape for the chord picker.
 *
 * When the selected shape appears in the search results it is pinned to the top;
 * otherwise the raw search results are returned as-is.
 *
 * @param query - Current search query string
 * @param maxNotes - Maximum note count filter
 * @param selectedShapeCode - Code of the currently selected chord shape
 * @returns Ordered shape list and the resolved selected shape
 */
export default function computeDisplayedShapes({
	query,
	maxNotes,
	selectedShapeCode,
}: Readonly<{
	query: string;
	maxNotes: number;
	selectedShapeCode: string;
}>): Readonly<{
	displayedShapes: readonly ChordShape[];
	selectedShape: ChordShape | undefined;
}> {
	const availableShapes = searchChordShapes({ query, maxNotes });
	const selectedShapeInResults = availableShapes.find((shape) => shape.code === selectedShapeCode);
	const displayedShapes =
		selectedShapeInResults === undefined
			? availableShapes
			: [
					selectedShapeInResults,
					...availableShapes.filter((shape) => shape.code !== selectedShapeInResults.code),
				];
	const selectedShape = getChordShapeByCode(selectedShapeCode) ?? displayedShapes[FIRST_SHAPE_INDEX];
	return { displayedShapes, selectedShape };
}
