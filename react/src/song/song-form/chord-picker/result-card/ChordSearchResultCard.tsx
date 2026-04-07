import transformChordTextForDisplay from "@/shared/music/chord-display/transformChordTextForDisplay";
import type { ChordShape } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import preferSharpIntervals from "../preferSharpIntervals";
import type { SelectedRoot } from "../root-picker/chordPickerRootOptionTypes";
import getCanonicalToken from "../use-chord-picker/getCanonicalToken";
import formatChordSearchDisplayText from "./formatChordSearchDisplayText";

type ChordSearchResultCardProps = Readonly<{
	shape: ChordShape;
	isSelected: boolean;
	onSelect: (shapeCode: string) => void;
	selectedRoot: SelectedRoot;
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | "";
}>;

/**
 * Renders a selectable card for a chord-shape search result.
 *
 * @param shape - Chord shape to present in the search results
 * @param isSelected - Whether this shape is currently selected
 * @param onSelect - Called when the user picks the shape
 * @returns Search result card button
 */
export default function ChordSearchResultCard({
	shape,
	isSelected,
	onSelect,
	selectedRoot,
	chordDisplayMode,
	songKey,
}: ChordSearchResultCardProps): ReactElement {
	const spellingDescription = formatChordSearchDisplayText(preferSharpIntervals(shape.spelling));
	const description =
		shape.altNames === ""
			? spellingDescription
			: `${spellingDescription} • ${formatChordSearchDisplayText(shape.altNames)}`;
	const displayCode = formatChordSearchDisplayText(shape.code);

	const token = getCanonicalToken({ selectedRoot, selectedShapeCode: shape.code, songKey });
	const previewToken =
		token === undefined
			? undefined
			: transformChordTextForDisplay(token, { chordDisplayMode, songKey });

	return (
		<button
			type="button"
			className={`w-full rounded-xl border px-4 py-3 text-left transition ${
				isSelected
					? "border-blue-400 bg-blue-500/20 text-white"
					: "border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800"
			}`}
			data-testid={`chord-shape-option-${shape.id}`}
			onClick={() => {
				onSelect(shape.code);
			}}
		>
			<div className="min-w-0">
				<div className="flex items-center justify-between gap-3">
					<div className="min-w-0 font-medium">
						<span className="font-mono text-base">{previewToken ?? displayCode}</span>
						<span className="px-1 text-gray-500">•</span>
						{shape.name}
					</div>
				</div>
				<div className="mt-1 text-sm text-gray-400">
					{previewToken === undefined ? description : `${displayCode} • ${description}`}
				</div>
			</div>
		</button>
	);
}
