import { useTranslation } from "react-i18next";

import formatAccidentals from "@/react/music/intervals/formatAccidentals";
import preferSharpIntervals from "@/react/music/intervals/preferSharpIntervals";
import type { ShapeInversion } from "@/react/music/inversions/shape-inversion.type";
import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";
import type { ChordShape } from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import ChordSearchResultCard from "./ChordSearchResultCard";

const EMPTY_SHAPE_COUNT = 0;

type ChordSearchResultsProps = Readonly<{
	displayedShapes: readonly ChordShape[];
	allShapeInversions: readonly ShapeInversion[];
	selectedRoot: SelectedRoot;
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | "";
	getNoteSearchRoot: (spelling: string) => SongKey | undefined;
	isShapeSelected: (shapeId: number) => boolean;
	setSelectedShapeCode: (shapeCode: string) => void;
	directShapeOrdinals: ReadonlyMap<string, { ordinalLabel: string; sourceShapeName: string }>;
	selectedBassNote: SongKey | undefined;
	inversionBaseShapeCode: string | undefined;
	handleSelectShapeInversion: (
		sourceShapeCode: string,
		inversion: ShapeInversion["inversion"],
	) => void;
}>;

/**
 * Renders the chord search result cards and inversion result cards for the picker search section.
 */
export default function ChordSearchResults({
	displayedShapes,
	allShapeInversions,
	selectedRoot,
	chordDisplayMode,
	songKey,
	getNoteSearchRoot,
	isShapeSelected,
	setSelectedShapeCode,
	directShapeOrdinals,
	selectedBassNote,
	inversionBaseShapeCode,
	handleSelectShapeInversion,
}: ChordSearchResultsProps): ReactElement {
	const { t } = useTranslation();

	return (
		<div
			className="grid grid-cols-1 gap-2 min-[900px]:grid-cols-2"
			data-testid="chord-shape-results"
		>
			{displayedShapes.length === EMPTY_SHAPE_COUNT &&
			allShapeInversions.length === EMPTY_SHAPE_COUNT ? (
				<div className="rounded-lg border border-dashed border-gray-700 px-3 py-4 text-sm text-gray-400">
					{t("song.chordNoResults", "No chord shapes match this search.")}
				</div>
			) : (
				<>
					{displayedShapes.map((shape) => {
						const noteSearchMatchRoot = getNoteSearchRoot(shape.spelling);
						const cardRoot =
							noteSearchMatchRoot === undefined
								? selectedRoot
								: {
										root: noteSearchMatchRoot,
										rootType: "absolute" as const,
										label: noteSearchMatchRoot,
									};
						return (
							<ChordSearchResultCard
								key={shape.id}
								shape={shape}
								isSelected={isShapeSelected(shape.id)}
								onSelect={setSelectedShapeCode}
								selectedRoot={cardRoot}
								chordDisplayMode={chordDisplayMode}
								songKey={songKey}
								inversionInfo={directShapeOrdinals.get(shape.code)}
							/>
						);
					})}
					{allShapeInversions.map(
						({ inversion, sourceShapeCode, sourceShapeName, displayToken }) => (
							<button
								key={`inv-${sourceShapeCode}-${inversion.bassRoot}-${String(inversion.inversionNumber)}`}
								type="button"
								className={`w-full rounded-xl border px-4 py-3 text-left transition ${
									selectedBassNote === inversion.bassRoot &&
									inversionBaseShapeCode === sourceShapeCode
										? "border-blue-400 bg-blue-500/20 text-white"
										: "border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800"
								}`}
								data-testid={`chord-inversion-result-${sourceShapeCode}-${String(inversion.inversionNumber)}`}
								onClick={() => {
									handleSelectShapeInversion(sourceShapeCode, inversion);
								}}
							>
								<div className="min-w-0">
									<div className="flex items-center justify-between gap-3">
										<div className="min-w-0 font-medium">
											<span className="font-mono text-base">{displayToken}</span>
											<span className="px-1 text-gray-500">•</span>
											{inversion.matchedShape?.name ?? sourceShapeName}
										</div>
										<span className="shrink-0 rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
											{inversion.ordinalLabel}
										</span>
									</div>
									<div className="mt-1 text-sm text-gray-400">
										{formatAccidentals(preferSharpIntervals(inversion.reRootedSpelling))}
									</div>
								</div>
							</button>
						),
					)}
				</>
			)}
		</div>
	);
}
