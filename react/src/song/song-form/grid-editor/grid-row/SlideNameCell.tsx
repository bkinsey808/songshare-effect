import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useTranslation } from "react-i18next";

import ChordSelect from "@/react/song/song-form/chord-picker/ChordSelect";
import { type Slide } from "@/react/song/song-form/song-form-types";

import hashToHue from "../duplicateTint";
import DragHandle from "./DragHandle";
import SlideNameDeleteAction from "./SlideNameDeleteAction";
import SlideNameLanguageSelect from "./SlideNameLanguageSelect";

const REMOVE_COUNT = 1;
const EMPTY_COUNT = 0;
const SINGLE_INSTANCE = 1;
type SlideNameCellProps = Readonly<{
	slideId: string;
	slide: Slide;
	editSlideName: ({
		slideId,
		newName,
	}: Readonly<{
		slideId: string;
		newName: string;
	}>) => void;
	setSlideOrder: (newOrder: readonly string[]) => void;
	slideOrder: readonly string[];
	duplicateSlide: (slideId: string) => void;
	deleteSlide: (slideId: string) => void;
	idx: number;
	confirmingDelete: boolean;
	setConfirmingDelete: (val: boolean) => void;
	globalIsDragging: boolean;
	attributes: DraggableAttributes;
	listeners: SyntheticListenerMap | undefined;
	/** When true, this cell uses the duplicate tint bg; the input keeps default dark bg. */
	isDuplicateRow: boolean;
	hasLyrics: boolean;
	currentChordToken: string | undefined;
	songChords: readonly string[];
	onSelectChord: (token: string) => void;
	hasScript: boolean;
	lyricsLanguages: readonly string[];
	scriptLanguages: readonly string[];
	activeLanguageField: "lyrics" | "script" | undefined;
	lyricsSelectedLanguageCode: string | undefined;
	onSelectLyricsLanguage: (code: string) => void;
	scriptSelectedLanguageCode: string | undefined;
	onSelectScriptLanguage: (code: string) => void;
}>;

/**
 * Render the fixed slide-name cell and row actions.
 *
 * Includes the drag handle, editable name input, duplicate action, and delete
 * or remove-from-presentation controls depending on row state.
 *
 * @param slideId - Unique identifier for the slide.
 * @param slide - Slide data object.
 * @param editSlideName - Handler that updates the slide name.
 * @param setSlideOrder - Setter for the presentation's slide order.
 * @param slideOrder - Current slide order array.
 * @param duplicateSlide - Handler that duplicates the slide by id.
 * @param deleteSlide - Handler that deletes the slide record.
 * @param idx - Index of this row within the slide order array.
 * @param confirmingDelete - Whether delete confirmation UI is visible.
 * @param setConfirmingDelete - Setter that toggles delete confirmation.
 * @param globalIsDragging - Whether any row is currently being dragged.
 * @param attributes - Draggable attributes from `useSortable`.
 * @param listeners - Drag listeners from `useSortable`.
 * @param isDuplicateRow - Whether this row belongs to a duplicate slide group.
 * @param hasLyrics - Whether this slide row contains lyrics (shows chord button)
 * @param currentChordToken - Chord token at or before the current insertion point
 * @param songChords - Distinct chord tokens already present in the song lyrics
 * @param onSelectChord - Inserts or replaces the selected existing chord token
 * @param hasScript - Whether this slide row contains a script
 * @param lyricsLanguages - Selected lyrics language codes
 * @param scriptLanguages - Selected script language codes
 * @param activeLanguageField - Field whose cursor/selection is currently active in the grid
 * @param lyricsSelectedLanguageCode - Language code of token at current lyrics cursor, or undefined
 * @param onSelectLyricsLanguage - Inserts or replaces the lyrics language token
 * @param scriptSelectedLanguageCode - Language code of token at current script cursor, or undefined
 * @param onSelectScriptLanguage - Inserts or replaces the script language token
 * @returns React element for the slide name cell.
 */
export default function SlideNameCell({
	slideId,
	slide,
	editSlideName,
	setSlideOrder,
	slideOrder,
	duplicateSlide,
	deleteSlide,
	idx,
	confirmingDelete,
	setConfirmingDelete,
	globalIsDragging,
	attributes,
	listeners,
	isDuplicateRow,
	hasLyrics,
	currentChordToken,
	songChords,
	onSelectChord,
	hasScript,
	lyricsLanguages,
	scriptLanguages,
	activeLanguageField,
	lyricsSelectedLanguageCode,
	onSelectLyricsLanguage,
	scriptSelectedLanguageCode,
	onSelectScriptLanguage,
}: SlideNameCellProps): ReactElement {
	const { t } = useTranslation();

	const tdClass =
		"border border-slate-700 pl-2 pr-2 pt-[var(--slides-grid-baseline-offset)] pb-2 align-top w-[var(--slide-name-width)] min-w-[var(--slide-name-width)] max-w-[var(--slide-name-width)] group-hover:border-slate-600";
	const inputClass = isDuplicateRow
		? "w-full rounded border border-slate-600 bg-slate-800 px-2 pt-0 pb-1 text-base leading-normal text-white focus:border-white/45 focus:outline-none"
		: "w-full rounded border border-slate-600 bg-slate-950 px-2 pt-0 pb-1 text-base leading-normal text-white focus:border-white/45 focus:outline-none";

	/*
	 * Baseline alignment with lyrics column: this td uses pt-[var(--slides-grid-baseline-offset)]
	 * so the first line of text sits that far from the row top. The input has pt-0 so its text
	 * starts at that offset with no extra space above. text-base leading-normal matches the
	 * lyrics column; both baselines align when lyrics use the corrected offset (SortableGridCells).
	 */
	return (
		<td
			className={tdClass}
			{...(isDuplicateRow
				? {
						"data-duplicate-tint": "",
						style: {
							"--duplicate-row-hue": `${hashToHue(slideId)}`,
						} as React.CSSProperties & Record<"--duplicate-row-hue", string>,
					}
				: {})}
		>
			<div className="space-y-2">
				<div>
					<input
						type="text"
						value={slide.slide_name}
						onChange={(event) => {
							editSlideName({ slideId, newName: event.target.value });
						}}
						className={inputClass}
						placeholder="Slide name"
					/>
				</div>
				{hasLyrics && activeLanguageField === "script" ? undefined : (
					<ChordSelect
						songChords={songChords}
						currentChordToken={currentChordToken}
						onSelectChord={onSelectChord}
					/>
				)}
				<SlideNameLanguageSelect
					hasLyrics={hasLyrics}
					hasScript={hasScript}
					lyricsLanguages={lyricsLanguages}
					scriptLanguages={scriptLanguages}
					activeLanguageField={activeLanguageField}
					lyricsSelectedLanguageCode={lyricsSelectedLanguageCode}
					onSelectLyricsLanguage={onSelectLyricsLanguage}
					scriptSelectedLanguageCode={scriptSelectedLanguageCode}
					onSelectScriptLanguage={onSelectScriptLanguage}
				/>
				<div className="flex gap-1">
					<DragHandle attributes={attributes} listeners={listeners} />
					<button
						className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white hover:bg-blue-700"
						type="button"
						onClick={() => {
							setSlideOrder([...slideOrder, slideId]);
						}}
						title={t(
							"song.addSameSlideAtAnotherPosition",
							"Add this same slide at another position",
						)}
						aria-label={t(
							"song.addSameSlideAtAnotherPosition",
							"Add this same slide at another position",
						)}
					>
						<span className="text-sm">🔗</span>
					</button>
					<button
						className="flex h-8 w-8 items-center justify-center rounded bg-green-600 text-white hover:bg-green-700"
						type="button"
						onClick={() => {
							duplicateSlide(slideId);
						}}
						title="Duplicate Slide"
						aria-label="Duplicate Slide"
					>
						<span className="text-sm">📋</span>
					</button>
					<button
						type="button"
						className="hidden"
						onClick={() => {
							const newSlideOrder = [...slideOrder];
							newSlideOrder.splice(idx, REMOVE_COUNT);
							setSlideOrder(newSlideOrder);

							const remainingInstances = newSlideOrder.filter((id) => id === slideId);
							if (remainingInstances.length === EMPTY_COUNT) {
								deleteSlide(slideId);
							}
						}}
						title={
							slideOrder.filter((id) => id === slideId).length === SINGLE_INSTANCE
								? "Delete Slide"
								: "Remove from Presentation"
						}
						aria-label={
							slideOrder.filter((id) => id === slideId).length === SINGLE_INSTANCE
								? "Delete Slide"
								: "Remove from Presentation"
						}
					>
						<span className="text-sm">🗑️</span>{" "}
					</button>{" "}
					<SlideNameDeleteAction
						slideId={slideId}
						slideOrder={slideOrder}
						idx={idx}
						setSlideOrder={setSlideOrder}
						deleteSlide={deleteSlide}
						confirmingDelete={confirmingDelete}
						setConfirmingDelete={setConfirmingDelete}
						globalIsDragging={globalIsDragging}
					/>
				</div>
			</div>
		</td>
	);
}
