import { useTranslation } from "react-i18next";

import AutoExpandingTextarea from "@/react/lib/design-system/auto-expanding-textarea/AutoExpandingTextarea";
import FormField from "@/react/lib/design-system/form/FormField";
import InsertChordButton from "@/react/song/song-form/chord-picker/InsertChordButton";
import { findLanguageByTag } from "@/shared/language/translationLanguages";
import { safeGet } from "@/shared/utils/safe";

import type useSlideDetailCard from "./useSlideDetailCard";

const TEXTAREA_MIN_ROWS = 3;

type SlideDetailFieldsProps = Readonly<{
	fields: readonly string[];
	slide: NonNullable<ReturnType<typeof useSlideDetailCard>["slide"]>;
	lyricsTextareaRef: ReturnType<typeof useSlideDetailCard>["lyricsTextareaRef"];
	isEditingChord: boolean;
	onEditFieldValue: ReturnType<typeof useSlideDetailCard>["onEditFieldValue"];
	onLyricsChange: ReturnType<typeof useSlideDetailCard>["onLyricsChange"];
	onOpenChordPicker: ReturnType<typeof useSlideDetailCard>["onOpenChordPicker"];
	onSyncLyricsSelection: ReturnType<typeof useSlideDetailCard>["onSyncLyricsSelection"];
	lyricsLanguage: string;
	scriptLanguage: string | undefined;
}>;

/**
 * Renders the editable slide field inputs, including the special lyrics editor UI.
 *
 * @param fields - Ordered slide fields to render
 * @param slide - Current slide data being edited
 * @param lyricsTextareaRef - Ref for the lyrics textarea used by chord insertion logic
 * @param isEditingChord - Whether the current lyrics selection is editing an existing chord token
 * @param onEditFieldValue - Updates non-lyrics field values
 * @param onLyricsChange - Updates the lyrics field and syncs selection state
 * @param onOpenChordPicker - Opens the chord picker for insert or edit mode
 * @param onSyncLyricsSelection - Syncs textarea selection into local hook state
 * @param lyricsLanguage - BCP 47 language code for the lyrics field.
 * @param scriptLanguage - Optional BCP 47 language code for the script field.
 * @returns Field editor list for the slide detail card
 */
export default function SlideDetailFields({
	fields,
	slide,
	lyricsTextareaRef,
	isEditingChord,
	onEditFieldValue,
	onLyricsChange,
	onOpenChordPicker,
	onSyncLyricsSelection,
	lyricsLanguage,
	scriptLanguage,
}: SlideDetailFieldsProps): ReactElement {
	const { t } = useTranslation();
	const lyricsValue = safeGet(slide.field_data, "lyrics") ?? "";

	return (
		<>
			{fields.map((field) => (
				<div key={field} className="mb-6">
					{field === "lyrics" ? (
						<div className="flex flex-col gap-2">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<span className="text-sm font-bold text-gray-300">
									{t("song.lyrics", "Lyrics")}
								</span>
								<InsertChordButton
									isEditingChord={isEditingChord}
									onOpenChordPicker={onOpenChordPicker}
								/>
							</div>
							<AutoExpandingTextarea
								textareaRef={lyricsTextareaRef}
								value={lyricsValue}
								onChange={onLyricsChange}
								onClick={onSyncLyricsSelection}
								onFocus={onSyncLyricsSelection}
								onKeyUp={onSyncLyricsSelection}
								onSelect={onSyncLyricsSelection}
								className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-white"
								minRows={TEXTAREA_MIN_ROWS}
								growWithContent
								resizeOnExternalValueChange={false}
							/>
						</div>
					) : (
						<FormField label={((): string => {
							if (field === "script") {
								return `Script: ${t(`song.${field}`, field)}`;
							}
							if (field === scriptLanguage) {
								const langEntry = findLanguageByTag(field);
								return langEntry ? `Script: ${langEntry.name}` : t(`song.${field}`, field);
							}
							if (field === lyricsLanguage) {
								const langEntry = findLanguageByTag(field);
								return langEntry ? `Lyrics: ${langEntry.name}` : t(`song.${field}`, field);
							}
							const langEntry = findLanguageByTag(field);
							return langEntry ? langEntry.name : t(`song.${field}`, field);
						})()}>
							<AutoExpandingTextarea
								value={safeGet(slide.field_data, field) ?? ""}
								onChange={(event) => {
									onEditFieldValue({
										field,
										value: event.target.value,
									});
								}}
								className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-white"
								minRows={TEXTAREA_MIN_ROWS}
								growWithContent
								resizeOnExternalValueChange={false}
							/>
						</FormField>
					)}
				</div>
			))}
		</>
	);
}
