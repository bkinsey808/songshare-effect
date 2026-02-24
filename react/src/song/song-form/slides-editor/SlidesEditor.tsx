// src/features/song-form/SlidesEditor.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";

import AutoExpandingTextarea from "@/react/lib/design-system/auto-expanding-textarea/AutoExpandingTextarea";
import Button from "@/react/lib/design-system/Button";
import FormField from "@/react/lib/design-system/form/FormField";
import ChevronDownIcon from "@/react/lib/design-system/icons/ChevronDownIcon";
import ChevronUpIcon from "@/react/lib/design-system/icons/ChevronUpIcon";
import PlusIcon from "@/react/lib/design-system/icons/PlusIcon";
import TrashIcon from "@/react/lib/design-system/icons/TrashIcon";
import { songFields } from "@/react/song/song-schema";
import { ONE } from "@/shared/constants/shared-constants";
import { type ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";
import { safeGet } from "@/shared/utils/safe";

import hashToHue from "../grid-editor/duplicateTint";
import { type Slide } from "../song-form-types";
import useSlidesEditor from "./useSlidesEditor";

type SlidesEditorProps = Readonly<
	ReadonlyDeep<{
		fields: readonly string[];
		toggleField: (field: string, checked: boolean) => void;
		// Array of slide IDs
		slideOrder: readonly string[];
		setSlideOrder: (newOrder: readonly string[]) => void;
		// ID -> Slide mapping
		slides: Readonly<Record<string, Slide>>;
		setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
	}>
>;

/**
 * Slides editor UI that renders slide detail cards and per-field editors.
 * Also exposes controls to add, duplicate, and delete slides and to change their order.
 *
 * @param fields - Which dynamic fields are enabled for each slide
 * @param toggleField - Toggle a field on/off in the form
 * @param slideOrder - Ordered array of slide ids (presentation order)
 * @param setSlideOrder - Setter to update the presentation order
 * @param slides - Map of slide id to slide data
 * @param setSlides - Setter to replace the slides map
 * @returns React element rendering the Slide Editor UI
 */
export default function SlidesEditor({
	fields,
	toggleField,
	slideOrder,
	setSlideOrder,
	slides,
	setSlides,
}: SlidesEditorProps): ReactElement {
	const {
		addSlide,
		deleteSlide,
		editFieldValue,
		editSlideName,
		safeGetField,
		removeSlideOrder,
		moveSlideUp,
		moveSlideDown,
	} = useSlidesEditor({
		slideOrder,
		setSlideOrder,
		slides,
		setSlides,
	});

	const [confirmingDeleteSlideId, setConfirmingDeleteSlideId] = useState<string | undefined>(
		undefined,
	);

	const { t } = useTranslation();
	const FIRST_INDEX = 0;
	const JSON_INDENT = 2;
	const TEXTAREA_MIN_ROWS = 3;
	const TEXTAREA_MAX_ROWS = 10;

	return (
		<div className="@container w-full">
			{/* Header with Fields */}
			<div className="mb-6">
				<fieldset className="flex flex-col gap-2">
					<legend className="text-sm font-bold text-gray-300">{t("song.fields", "Fields")}</legend>
					<div className="mt-2 flex flex-col gap-2">
						{songFields.map((field) => (
							<label key={field} className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={fields.includes(field)}
									onChange={(event) => {
										toggleField(field, event.target.checked);
									}}
								/>
								{t(`song.${field}`, field)}
							</label>
						))}
					</div>
				</fieldset>
			</div>

			<h2 className="mb-2 text-sm font-bold text-gray-300">Slides</h2>
			{
				// One card per position in slideOrder (same order and duplicates as the grid)
				slideOrder.map((slideId, idx) => {
					const slide = safeGet(slides, slideId);
					if (!slide) {
						return undefined;
					}
					const isDuplicate = slideOrder.filter((id) => id === slideId).length > ONE;
					return (
						<div
							key={`slide-detail-${String(idx)}`}
							className="mb-6 rounded-lg border border-gray-600 p-4"
							{...(isDuplicate
								? {
										"data-duplicate-tint": "",
										style: {
											"--duplicate-row-hue": `${hashToHue(slideId)}`,
										} as React.CSSProperties & Record<"--duplicate-row-hue", string>,
									}
								: {})}
						>
							<div className="mb-6">
								<FormField label={t("song.slideName", "Slide Name")}>
									<input
										type="text"
										value={slide.slide_name}
										onChange={(event) => {
											editSlideName({ slideId, newName: event.target.value });
										}}
										className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-4 py-1 text-white"
										placeholder="Slide name"
									/>
								</FormField>
							</div>

							{/* Only show text areas for currently selected fields */}
							{fields.map((field) => (
								<div key={field} className="mb-6">
									<FormField label={t(`song.${field}`, field)}>
										<AutoExpandingTextarea
											value={safeGetField({
												slides,
												slideId,
												field,
											})}
											onChange={(event) => {
												editFieldValue({
													slideId,
													field,
													value: event.target.value,
												});
											}}
											className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-white"
											minRows={TEXTAREA_MIN_ROWS}
											maxRows={TEXTAREA_MAX_ROWS}
										/>
									</FormField>
								</div>
							))}
							{slideOrder.length > ONE && (
								<div className="mt-4 flex flex-wrap items-center justify-start gap-2">
									<Button
										size="compact"
										variant="outlineSecondary"
										icon={<ChevronUpIcon className="size-4" />}
										onClick={() => {
											moveSlideUp(idx);
										}}
										disabled={idx === FIRST_INDEX}
										aria-label={t("song.moveSlideUpAria", "Move slide up in presentation")}
									>
										{t("song.moveSlideUp", "Up")}
									</Button>
									<Button
										size="compact"
										variant="outlineSecondary"
										icon={<ChevronDownIcon className="size-4" />}
										onClick={() => {
											moveSlideDown(idx);
										}}
										disabled={idx === slideOrder.length - ONE}
										aria-label={t("song.moveSlideDownAria", "Move slide down in presentation")}
									>
										{t("song.moveSlideDown", "Down")}
									</Button>
									{(() => {
										if (confirmingDeleteSlideId === slideId) {
											return (
												<>
													<span className="flex items-center text-sm text-gray-300">
														{t("song.deleteSlide.confirmPrompt", "Delete this slide permanently?")}
													</span>
													<Button
														size="compact"
														variant="outlineSecondary"
														onClick={() => {
															setConfirmingDeleteSlideId(undefined);
														}}
													>
														{t("song.deleteSlide.cancel", "Cancel")}
													</Button>
													<Button
														size="compact"
														variant="danger"
														icon={<TrashIcon className="size-4" />}
														onClick={() => {
															deleteSlide(slideId);
															setConfirmingDeleteSlideId(undefined);
														}}
													>
														{t("song.deleteSlide.confirm", "Delete slide")}
													</Button>
												</>
											);
										}
										if (isDuplicate) {
											return (
												<Button
													size="compact"
													variant="outlineDanger"
													icon={<TrashIcon className="size-4" />}
													onClick={() => {
														removeSlideOrder({ slideId, index: idx });
													}}
													aria-label={t("song.removeFromPresentation", "Remove from presentation")}
													data-testid="remove-from-presentation"
												>
													{t("song.removeFromPresentation", "Remove Slide")}
												</Button>
											);
										}
										return (
											<Button
												size="compact"
												variant="outlineDanger"
												icon={<TrashIcon className="size-4" />}
												onClick={() => {
													setConfirmingDeleteSlideId(slideId);
												}}
												aria-label={t("song.deleteSlide.button", "Delete slide")}
												data-testid="delete-slide-button"
											>
												{t("song.deleteSlide.button", "Delete Slide")}
											</Button>
										);
									})()}
								</div>
							)}
							{/* Debug info - remove this in production */}
							<details className="mt-4 text-xs text-gray-500">
								<summary>Debug: All field data for this slide</summary>
								<pre className="mt-2 rounded bg-gray-100 p-2">
									{JSON.stringify(slide.field_data, undefined, JSON_INDENT)}
								</pre>
							</details>
						</div>
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
