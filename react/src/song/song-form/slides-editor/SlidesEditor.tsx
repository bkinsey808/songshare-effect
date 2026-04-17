import { useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "@/react/lib/design-system/Button";
import PlusIcon from "@/react/lib/design-system/icons/PlusIcon";
import { ONE } from "@/shared/constants/shared-constants";
import { type ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import { type OpenChordPicker, type Slide } from "../song-form-types";
import SlideDetailCard from "./slide-detail-card/SlideDetailCard";
import useSlidesEditor from "./useSlidesEditor";

type SlidesEditorProps = Readonly<
	ReadonlyDeep<{
		fields: readonly string[];
		lyricsLanguages: readonly string[];
		scriptLanguages: readonly string[];
		slideOrder: readonly string[];
		setSlideOrder: (newOrder: readonly string[]) => void;
		slides: Readonly<Record<string, Slide>>;
		setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
		openChordPicker?: OpenChordPicker;
	}>
>;

/**
 * No-op fallback for optional `openChordPicker` prop.
 *
 * @returns Nothing
 */
function noopOpenChordPicker(): void {
	return undefined;
}

/**
 * Slides editor UI that renders slide detail cards and per-field editors.
 * Also exposes controls to add, duplicate, and delete slides and to change their order.
 *
 * @param fields - Which dynamic fields are active for each slide (derived from lyrics/script/translations)
 * @param lyricsLanguages - Selected lyrics language codes
 * @param scriptLanguages - Selected script language codes
 * @param slideOrder - Ordered array of slide ids (presentation order)
 * @param setSlideOrder - Setter to update the presentation order
 * @param slides - Map of slide id to slide data
 * @param setSlides - Setter to replace the slides map
 * @param openChordPicker - Optional callback to open the chord picker UI
 * @returns React element rendering the Slide Editor UI
 */
export default function SlidesEditor({
	fields,
	lyricsLanguages,
	scriptLanguages,
	slideOrder,
	setSlideOrder,
	slides,
	setSlides,
	openChordPicker = noopOpenChordPicker,
}: SlidesEditorProps): ReactElement {
	const { t } = useTranslation();

	const {
		addSlide,
		deleteSlide,
		editFieldValue,
		editSlideName,
		removeSlideOrder,
		moveSlideUp,
		moveSlideDown,
		backgroundPickerSlideId,
		toggleBackgroundPicker,
		selectSlideBackgroundImage,
		clearSlideBackgroundImage,
	} = useSlidesEditor({
		slideOrder,
		setSlideOrder,
		slides,
		setSlides,
		enableBackgroundLibrary: true,
	});

	const [confirmingDeleteSlideId, setConfirmingDeleteSlideId] = useState<string | undefined>(
		undefined,
	);
	const slideDetailUiState = {
		confirmingDeleteSlideId,
		setConfirmingDeleteSlideId,
		backgroundPickerSlideId,
	} as const;
	const slideDetailActions = {
		openChordPicker,
		editSlideName,
		editFieldValue,
		toggleBackgroundPicker,
		selectSlideBackgroundImage,
		clearSlideBackgroundImage,
		moveSlideUp,
		moveSlideDown,
		deleteSlide,
		removeSlideOrder,
	} as const;

	const slideDetailKeyCounts = new Map<string, number>();

	const FIRST_INDEX = 0;

	return (
		<div className="@container w-full">
			<h2 className="mb-2 text-sm font-bold text-gray-300">{t("song.slides", "Slides")}</h2>
			{
				// One card per position in slideOrder (same order and duplicates as the grid)
				slideOrder.map((slideId, idx) => {
					const occurrence = (slideDetailKeyCounts.get(slideId) ?? FIRST_INDEX) + ONE;
					slideDetailKeyCounts.set(slideId, occurrence);
					return (
						<SlideDetailCard
							key={`slide-detail-${slideId}-${String(occurrence)}`}
							slideId={slideId}
							idx={idx}
							fields={fields}
							lyricsLanguages={lyricsLanguages}
							scriptLanguages={scriptLanguages}
							slideOrder={slideOrder}
							slides={slides}
							uiState={slideDetailUiState}
							actions={slideDetailActions}
						/>
					);
				})
			}
			<div className="mt-6 flex justify-start">
				<Button
					size="compact"
					variant="primary"
					icon={<PlusIcon className="size-4" />}
					onClick={addSlide}
				>
					Add New Slide
				</Button>
			</div>
		</div>
	);
}
