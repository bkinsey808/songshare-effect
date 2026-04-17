import { useTranslation } from "react-i18next";

import AutoExpandingTextarea from "@/react/lib/design-system/auto-expanding-textarea/AutoExpandingTextarea";
import FormField from "@/react/lib/design-system/form/FormField";
import InsertChordButton from "@/react/song/song-form/chord-picker/InsertChordButton";
import { findLanguageByTag } from "@/shared/language/translationLanguages";
import { safeGet } from "@/shared/utils/safe";

import type useSlideDetailCard from "./useSlideDetailCard";

const TEXTAREA_MIN_ROWS = 3;
const EMPTY_LENGTH = 0;

type SlideDetailFieldsProps = Readonly<{
	fields: readonly string[];
	slide: NonNullable<ReturnType<typeof useSlideDetailCard>["slide"]>;
	lyricsTextareaRef: ReturnType<typeof useSlideDetailCard>["lyricsTextareaRef"];
	isEditingChord: boolean;
	lyricsLanguages: readonly string[];
	scriptLanguages: readonly string[];
	onEditFieldValue: ReturnType<typeof useSlideDetailCard>["onEditFieldValue"];
	onLyricsChange: ReturnType<typeof useSlideDetailCard>["onLyricsChange"];
	onOpenChordPicker: ReturnType<typeof useSlideDetailCard>["onOpenChordPicker"];
	onSyncLyricsSelection: ReturnType<typeof useSlideDetailCard>["onSyncLyricsSelection"];
}>;

/**
 * Formats a list of language codes into a comma-separated string of language names.
 *
 * @param codes - Array of language codes
 * @returns Comma-separated string of language names
 */
function formatLanguageList(codes: readonly string[]): string {
	return codes.map((code) => {
		const entry = findLanguageByTag(code);
		return entry ? entry.name : code;
	}).join(", ");
}

/**
 * Renders the editable slide field inputs, including the special lyrics editor UI.
 *
 * @param fields - Ordered slide fields to render
 * @param slide - Current slide data being edited
 * @param lyricsTextareaRef - Ref for the lyrics textarea used by chord insertion logic
 * @param isEditingChord - Whether the current lyrics selection is editing an existing chord token
 * @param lyricsLanguages - Selected lyrics language codes
 * @param scriptLanguages - Selected script language codes
 * @param onEditFieldValue - Updates non-lyrics field values
 * @param onLyricsChange - Updates the lyrics field and syncs selection state
 * @param onOpenChordPicker - Opens the chord picker for insert or edit mode
 * @param onSyncLyricsSelection - Syncs textarea selection into local hook state
 * @returns Field editor list for the slide detail card
 */
export default function SlideDetailFields({
	fields,
	slide,
	lyricsTextareaRef,
	isEditingChord,
	lyricsLanguages,
	scriptLanguages,
	onEditFieldValue,
	onLyricsChange,
	onOpenChordPicker,
	onSyncLyricsSelection,
}: SlideDetailFieldsProps): ReactElement {
	const { t } = useTranslation();
	const lyricsValue = safeGet(slide.field_data, "lyrics") ?? "";

	const lyricsLabel = lyricsLanguages.length > EMPTY_LENGTH
		? `${t("song.lyrics", "Lyrics")}: ${formatLanguageList(lyricsLanguages)}`
		: t("song.lyrics", "Lyrics");

	return (
		<>
			{fields.map((field) => (
				<div key={field} className="mb-6">
					{field === "lyrics" ? (
						<div className="flex flex-col gap-2">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<span className="text-sm font-bold text-gray-300">
									{lyricsLabel}
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
								return scriptLanguages.length > EMPTY_LENGTH
									? `${t("song.script", "Script")}: ${formatLanguageList(scriptLanguages)}`
									: t("song.script", "Script");
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
