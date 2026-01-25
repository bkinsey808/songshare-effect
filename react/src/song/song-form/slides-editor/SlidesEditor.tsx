// src/features/song-form/SlidesEditor.tsx
import { useTranslation } from "react-i18next";

import { type ReadonlyDeep } from "@/shared/types/deep-readonly";
import { safeGet } from "@/shared/utils/safe";

import AutoExpandingTextarea from "../../../design-system/AutoExpandingTextarea";
import FormField from "../../../design-system/form/FormField";
import { songFields } from "../../song-schema";
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

export default function SlidesEditor({
	fields,
	toggleField,
	slideOrder,
	setSlideOrder,
	slides,
	setSlides,
}: SlidesEditorProps): ReactElement {
	const { addSlide, deleteSlide, editFieldValue, editSlideName, safeGetField } = useSlidesEditor({
		slideOrder,
		setSlideOrder,
		slides,
		setSlides,
	});

	const { t } = useTranslation();
	const ONE = 1;
	const JSON_INDENT = 2;
	const TEXTAREA_MIN_ROWS = 3;
	const TEXTAREA_MAX_ROWS = 10;

	return (
		<div className="@container w-full">
			{/* Header with Fields and Add Button */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				{/* Fields Selection */}
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

				{/* Add New Slide Button */}
				<button
					type="button"
					onClick={addSlide}
					className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 sm:shrink-0"
				>
					Add New Slide
				</button>
			</div>

			<h2 className="mb-2 text-sm font-bold text-gray-300">Slides</h2>
			{
				// Show all slides based on keys in the slides object
				Object.keys(slides).map((slideId, idx) => {
					const slide = safeGet(slides, slideId);
					if (!slide) {
						return undefined;
					}
					return (
						<div
							key={`${slideId}-detail-${String(idx)}`}
							className="mb-6 rounded-lg border border-gray-600 p-4"
						>
							<div className="mb-6">
								<FormField label={t("song.slideName", "Slide Name")}>
									<input
										type="text"
										value={slide.slide_name}
										onChange={(event) => {
											editSlideName({ slideId, newName: event.target.value });
										}}
										className="mt-1 w-full rounded border px-4 py-1"
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
											className="mt-1 w-full rounded border px-2 py-1"
											minRows={TEXTAREA_MIN_ROWS}
											maxRows={TEXTAREA_MAX_ROWS}
										/>
									</FormField>
								</div>
							))}
							<div className="mt-4 flex justify-start">
								<button
									type="button"
									className="remove-slide-btn rounded border border-transparent bg-red-600 px-4 py-1 text-base font-semibold text-white shadow transition-colors duration-150 hover:bg-red-700 focus:ring-4 focus:outline-none"
									onClick={() => {
										deleteSlide(slideId);
									}}
									aria-label={`Remove slide ${String(idx + ONE)}`}
								>
									Delete&nbsp;Slide
								</button>
							</div>
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
		</div>
	);
}
