import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";

import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import cssVars from "@/react/lib/utils/cssVars";
import { findLanguageByTag } from "@/shared/language/translationLanguages";
import { type ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";
import { safeGet } from "@/shared/utils/safe";

import { type OpenChordPicker, type Slide } from "../song-form-types";
import SlidesGridRow from "./grid-row/SlidesGridRow";
import ResizeHandle from "./ResizeHandle";
import useSlidesGridTable from "./useSlidesGridTable";

const DEFAULT_FIELD_WIDTH = 300;
const SLIDE_NAME_WIDTH = 144;
const SLIDE_BACKGROUND_WIDTH = 240;
const EMPTY_COUNT = 0;
const SINGLE_OCCURRENCE = 1;

type SlidesGridTableProps = Readonly<
	ReadonlyDeep<{
		readonly fields: readonly string[];
		readonly lyricsLanguages: readonly string[];
		readonly scriptLanguages: readonly string[];
		readonly slideOrder: readonly string[];
		slides: Readonly<Record<string, Slide>>;
		horizontalScrollThreshold: number;

		editSlideName: ({ slideId, newName }: { slideId: string; newName: string }) => void;
		editFieldValue: ({
			slideId,
			field,
			value,
		}: {
			slideId: string;
			field: string;
			value: string;
		}) => void;
		safeGetField: ({
			slides,
			slideId,
			field,
		}: {
			slides: Readonly<Record<string, Slide>>;
			slideId: string;
			field: string;
		}) => string;
		setSlideOrder: (newOrder: readonly string[]) => void;
		duplicateSlide: (slideId: string) => void;
		deleteSlide: (slideId: string) => void;
		backgroundPickerSlideId: string | undefined;
		isImageLibraryLoading: boolean;
		imageLibraryEntryList: readonly ImageLibraryEntry[];
		toggleBackgroundPicker: (slideId: string) => void;
		selectSlideBackgroundImage: (
			params: Readonly<{
				slideId: string;
				backgroundImageId: string;
				backgroundImageUrl: string;
			}>,
		) => void;
		clearSlideBackgroundImage: (slideId: string) => void;
		openChordPicker: OpenChordPicker;
	}>
>;

function formatLanguageList(codes: readonly string[]): string {
	return codes.map((code) => {
		const entry = findLanguageByTag(code);
		return entry ? entry.name : code;
	}).join(", ");
}

/**
 * Render the sortable slides grid table and drag-and-drop container.
 *
 * Owns the column width state, drag sensors, and duplicate-row grouping used
 * by the grid editor.
 *
 * @param fields - Dynamic field columns rendered as table columns.
 * @param lyricsLanguages - Selected lyrics language codes
 * @param scriptLanguages - Selected script language codes
 * @param slideOrder - Ordered list of slide ids to render.
 * @param slides - Lookup of slide objects by id.
 * @param horizontalScrollThreshold - Pixel threshold that forces horizontal scrolling.
 * @param editSlideName - Handler that updates a slide name.
 * @param editFieldValue - Handler that updates a field value.
 * @param safeGetField - Safe accessor that returns display text for a field.
 * @param setSlideOrder - Setter for the presentation's slide order array.
 * @param duplicateSlide - Handler that duplicates the slide by id.
 * @param deleteSlide - Handler that deletes the slide by id.
 * @param backgroundPickerSlideId - Currently open background picker slide id.
 * @param isImageLibraryLoading - Whether image library data is loading.
 * @param imageLibraryEntryList - Available image library entries.
 * @param toggleBackgroundPicker - Toggles the inline background picker.
 * @param selectSlideBackgroundImage - Applies a background image to the slide.
 * @param clearSlideBackgroundImage - Clears the current slide background image.
 * @param openChordPicker - Callback to open the chord picker for a slide row
 * @returns React element for the slides grid table and DnD container.
 */
export default function SlidesGridTable({
	fields,
	lyricsLanguages,
	scriptLanguages,
	slideOrder,
	slides,
	horizontalScrollThreshold,
	editSlideName,
	editFieldValue,
	safeGetField,
	setSlideOrder,
	duplicateSlide,
	deleteSlide,
	backgroundPickerSlideId,
	isImageLibraryLoading,
	imageLibraryEntryList,
	toggleBackgroundPicker,
	selectSlideBackgroundImage,
	clearSlideBackgroundImage,
	openChordPicker,
}: SlidesGridTableProps): ReactElement {
	const { t } = useTranslation();
	const {
		duplicateGroupBySlideId,
		fieldWidthVars,
		globalIsDragging,
		handleDragCancel,
		handleDragEnd,
		handleDragStart,
		isResizing,
		sensors,
		sortableItems,
		startResize,
		totalWidth,
	} = useSlidesGridTable({
		fields,
		slideOrder,
		setSlideOrder,
		defaultFieldWidth: DEFAULT_FIELD_WIDTH,
		slideNameWidth: SLIDE_NAME_WIDTH,
	});
	const slideRowKeyCounts = new Map<string, number>();

	return (
		<div
			className="overflow-x-auto"
			style={{
				maxWidth: "100%",
				overflowX:
					totalWidth + SLIDE_BACKGROUND_WIDTH > horizontalScrollThreshold ? "scroll" : "auto",
			}}
		>
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={handleDragStart}
				onDragCancel={handleDragCancel}
				onDragEnd={handleDragEnd}
			>
				<table
					className="min-w-(--table-min-width) border-collapse border border-gray-300 dark:border-gray-600"
					style={cssVars({
						"slide-name-width": `${SLIDE_NAME_WIDTH}px`,
						"slide-background-width": `${SLIDE_BACKGROUND_WIDTH}px`,
						"table-min-width": `${totalWidth + SLIDE_BACKGROUND_WIDTH}px`,
						/*
						 * Baseline alignment: slide-name input and first line of lyrics share the same
						 * baseline. We use em so spacing scales with font-size and works across fonts.
						 *
						 * --slides-grid-baseline-offset: Distance from the row top to where the first
						 * line of text should sit. The slide-name <td> uses this as padding-top; the
						 * input uses pt-0 so its text starts at that offset. 0.25em gives a small
						 * buffer above the first line.
						 *
						 * --slides-grid-textarea-baseline-correction: <textarea> typically positions
						 * its first line lower than <input> for the same padding (browser/line-box
						 * differences). We subtract this from the baseline offset for the lyrics
						 * textarea so its first baseline lines up with the slide-name. 0.2em is an
						 * empirical correction; adjust if alignment drifts with different fonts.
						 */
						"slides-grid-baseline-offset": "0.25em",
						"slides-grid-textarea-baseline-correction": "0.2em",
						"slides-grid-focus-ring": "inset 0 0 0 1px rgb(255 255 255 / 0.45)",
						...fieldWidthVars,
					})}
				>
					<thead className="bg-gray-50 dark:bg-gray-800">
						<tr>
							{/* Fixed Slide Name Column */}
							<th className="relative border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold dark:text-white w-(--slide-name-width) min-w-(--slide-name-width) max-w-(--slide-name-width)">
								{t("song.slideName", "Slide Name")}
							</th>
							{/* Resizable Field Columns */}
							{fields.map((field) => {
								const safeName = String(field).replaceAll(/[^a-zA-Z0-9_-]/g, "-");
								const varName = `field-${safeName}-width`;
								const thStyle = cssVars({
									"slides-grid-field-width": `var(--${varName})`,
								});
								return (
									<th
										key={field}
										className="relative border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold dark:text-white w-(--slides-grid-field-width) min-w-(--slides-grid-field-width) max-w-(--slides-grid-field-width)"
										style={thStyle}
									>
										{(() => {
											if (field === "lyrics") {
												const baseLabel = t("song.lyrics", "Lyrics");
												return lyricsLanguages.length > EMPTY_COUNT
													? `${baseLabel}: ${formatLanguageList(lyricsLanguages)}`
													: baseLabel;
											}
											if (field === "script") {
												const baseLabel = t("song.script", "Script");
												return scriptLanguages.length > EMPTY_COUNT
													? `${baseLabel}: ${formatLanguageList(scriptLanguages)}`
													: baseLabel;
											}
											const langEntry = findLanguageByTag(field);
											return langEntry ? langEntry.name : t(`song.${field}`, field);
										})()}
										{/* Resize Handle */}
										<ResizeHandle
											field={field}
											onStartResize={startResize}
											isResizing={isResizing}
										/>
									</th>
									);
								})}
							<th className="relative border border-gray-300 px-4 py-2 text-left font-semibold dark:border-gray-600 dark:text-white w-(--slide-background-width) min-w-(--slide-background-width) max-w-(--slide-background-width)">
								{t("song.slideBackgroundImage", "Background Image")}
							</th>
						</tr>
					</thead>
					<SortableContext items={[...sortableItems]}>
						<tbody>
							{slideOrder.map((slideId, idx) => {
								const occurrence =
									(slideRowKeyCounts.get(slideId) ?? EMPTY_COUNT) + SINGLE_OCCURRENCE;
								slideRowKeyCounts.set(slideId, occurrence);
								const slide = safeGet(slides, slideId);
								if (!slide) {
									return undefined;
								}

								return (
									<SlidesGridRow
										key={`${slideId}-grid-${String(occurrence)}`}
										slideId={slideId}
										slide={slide}
										fields={fields}
										editSlideName={editSlideName}
										editFieldValue={editFieldValue}
										safeGetField={safeGetField}
										setSlideOrder={setSlideOrder}
										slideOrder={slideOrder}
										duplicateSlide={duplicateSlide}
										deleteSlide={deleteSlide}
										slides={slides}
										idx={idx}
										globalIsDragging={globalIsDragging}
										isDuplicateRow={duplicateGroupBySlideId.has(slideId)}
										backgroundPickerSlideId={backgroundPickerSlideId}
										isImageLibraryLoading={isImageLibraryLoading}
										imageLibraryEntryList={imageLibraryEntryList}
										toggleBackgroundPicker={toggleBackgroundPicker}
										selectSlideBackgroundImage={selectSlideBackgroundImage}
										clearSlideBackgroundImage={clearSlideBackgroundImage}
										openChordPicker={openChordPicker}
									/>
								);
							})}
						</tbody>
					</SortableContext>
				</table>
			</DndContext>

			{slideOrder.length === EMPTY_COUNT && (
				<div className="mt-8 text-center text-gray-500 dark:text-gray-400">
					<p>No slides yet. Click &quot;Add New Slide&quot; to get started.</p>
				</div>
			)}
		</div>
	);
}
