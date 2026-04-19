import { useTranslation } from "react-i18next";

import AutoExpandingTextarea from "@/react/lib/design-system/auto-expanding-textarea/AutoExpandingTextarea";
import FormField from "@/react/lib/design-system/form/FormField";
import FormTextarea from "@/react/lib/design-system/form/FormTextarea";
import ChordSelect from "@/react/song/song-form/chord-picker/ChordSelect";
import { findLanguageByTag } from "@/shared/language/translationLanguages";
import { safeGet } from "@/shared/utils/safe";

import type useSlideDetailCard from "./useSlideDetailCard";

const TEXTAREA_MIN_ROWS = 3;
const EMPTY_LENGTH = 0;
const SINGLE_LANGUAGE_LENGTH = 1;
const SLIDE_TEXTAREA_CLASS = "border-gray-600 bg-slate-950 text-white";

type SlideDetailFieldsProps = Readonly<{
	fields: readonly string[];
	slide: NonNullable<ReturnType<typeof useSlideDetailCard>["slide"]>;
	lyricsLanguages: readonly string[];
	scriptLanguages: readonly string[];
	lyricsEditor: ReturnType<typeof useSlideDetailCard>["lyricsEditor"];
	scriptEditor: ReturnType<typeof useSlideDetailCard>["scriptEditor"];
	onEditFieldValue: ReturnType<typeof useSlideDetailCard>["onEditFieldValue"];
}>;

/**
 * Formats a list of language codes into a comma-separated string of language names.
 *
 * @param codes - Array of language codes
 * @returns Comma-separated string of language names
 */
function formatLanguageList(codes: readonly string[]): string {
	return codes
		.map((code) => {
			const entry = findLanguageByTag(code);
			return entry ? entry.name : code;
		})
		.join(", ");
}

/**
 * Renders the editable slide field inputs, including the special lyrics and script editors.
 *
 * @param fields - Ordered slide fields to render
 * @param slide - Current slide data being edited
 * @param lyricsLanguages - Selected lyrics language codes
 * @param scriptLanguages - Selected script language codes
 * @param lyricsEditor - The editor hook returns for lyrics
 * @param scriptEditor - The editor hook returns for script
 * @param onEditFieldValue - Updates non-lyrics/script field values
 * @returns Field editor list for the slide detail card
 */
export default function SlideDetailFields({
	fields,
	slide,
	lyricsLanguages,
	scriptLanguages,
	lyricsEditor,
	scriptEditor,
	onEditFieldValue,
}: SlideDetailFieldsProps): ReactElement {
	const { t } = useTranslation();
	const lyricsValue = safeGet(slide.field_data, "lyrics") ?? "";
	const scriptValue = safeGet(slide.field_data, "script") ?? "";

	const lyricsLabel =
		lyricsLanguages.length > EMPTY_LENGTH
			? `${t("song.lyrics", "Lyrics")}: ${formatLanguageList(lyricsLanguages)}`
			: t("song.lyrics", "Lyrics");

	const scriptLabel =
		scriptLanguages.length > EMPTY_LENGTH
			? `${t("song.script", "Script")}: ${formatLanguageList(scriptLanguages)}`
			: t("song.script", "Script");

	/**
	 * Applies the selected lyrics language token to the current lyrics cursor position.
	 *
	 * @param event - Change event emitted by the lyrics language select
	 * @returns Nothing
	 */
	function handleLyricsLanguageChange(event: React.ChangeEvent<HTMLSelectElement>): void {
		if (event.target.value !== "") {
			lyricsEditor.handleSelectLanguage(event.target.value);
		}
	}

	/**
	 * Applies the selected script language token to the current script cursor position.
	 *
	 * @param event - Change event emitted by the script language select
	 * @returns Nothing
	 */
	function handleScriptLanguageChange(event: React.ChangeEvent<HTMLSelectElement>): void {
		if (event.target.value !== "") {
			scriptEditor.handleSelectLanguage(event.target.value);
		}
	}

	return (
		<>
			{fields.map((field) => {
				if (field === "lyrics") {
					return (
						<div key={field} className="mb-6">
							<div className="flex flex-col gap-2">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<span className="text-sm font-bold text-gray-300">{lyricsLabel}</span>
									<div className="flex flex-wrap gap-2">
										{lyricsLanguages.length > SINGLE_LANGUAGE_LENGTH && (
											<select
												value={lyricsEditor.selectedLanguageToken?.languageCode ?? ""}
												onChange={handleLyricsLanguageChange}
												className="cursor-pointer rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-gray-300 hover:border-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
											>
												<option value="" disabled hidden>
													Language
												</option>
												{lyricsLanguages.map((code) => {
													const lang = findLanguageByTag(code);
													return (
														<option key={code} value={code} className="bg-gray-900 text-gray-200">
															{lang ? lang.name : code}
														</option>
													);
												})}
											</select>
										)}
										<ChordSelect
											songChords={lyricsEditor.existingChordTokens}
											currentChordToken={lyricsEditor.currentChordToken?.token}
											onSelectChord={lyricsEditor.handleSelectChord}
										/>
									</div>
								</div>
								<AutoExpandingTextarea
									textareaRef={lyricsEditor.textareaRef}
									value={lyricsValue}
									onChange={lyricsEditor.handleChange}
									onClick={lyricsEditor.handleSyncSelection}
									onFocus={lyricsEditor.handleSyncSelection}
									onKeyUp={lyricsEditor.handleSyncSelection}
									onSelect={lyricsEditor.handleSyncSelection}
									className={`mt-1 w-full rounded border px-2 py-1 ${SLIDE_TEXTAREA_CLASS}`}
									minRows={TEXTAREA_MIN_ROWS}
									growWithContent
									resizeOnExternalValueChange={false}
								/>
							</div>
						</div>
					);
				}

				if (field === "script") {
					return (
						<div key={field} className="mb-6">
							<div className="flex flex-col gap-2">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<span className="text-sm font-bold text-gray-300">{scriptLabel}</span>
									<div className="flex flex-wrap gap-2">
										{scriptLanguages.length > SINGLE_LANGUAGE_LENGTH && (
											<select
												value={scriptEditor.selectedLanguageToken?.languageCode ?? ""}
												onChange={handleScriptLanguageChange}
												className="cursor-pointer rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-gray-300 hover:border-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
											>
												<option value="" disabled hidden>
													Language
												</option>
												{scriptLanguages.map((code) => {
													const lang = findLanguageByTag(code);
													return (
														<option key={code} value={code} className="bg-gray-900 text-gray-200">
															{lang ? lang.name : code}
														</option>
													);
												})}
											</select>
										)}
									</div>
								</div>
								<AutoExpandingTextarea
									textareaRef={scriptEditor.textareaRef}
									value={scriptValue}
									onChange={scriptEditor.handleChange}
									onClick={scriptEditor.handleSyncSelection}
									onFocus={scriptEditor.handleSyncSelection}
									onKeyUp={scriptEditor.handleSyncSelection}
									onSelect={scriptEditor.handleSyncSelection}
									className={`mt-1 w-full rounded border px-2 py-1 ${SLIDE_TEXTAREA_CLASS}`}
									minRows={TEXTAREA_MIN_ROWS}
									growWithContent
									resizeOnExternalValueChange={false}
								/>
							</div>
						</div>
					);
				}

				return (
					<div key={field} className="mb-6">
						<FormField
							label={((): string => {
								const langEntry = findLanguageByTag(field);
								return langEntry ? langEntry.name : t(`song.${field}`, field);
							})()}
						>
							<FormTextarea
								value={safeGet(slide.field_data, field) ?? ""}
								onChange={(event) => {
									onEditFieldValue({
										field,
										value: event.target.value,
									});
								}}
								className={SLIDE_TEXTAREA_CLASS}
								rows={TEXTAREA_MIN_ROWS}
								autoExpand
							/>
						</FormField>
					</div>
				);
			})}
		</>
	);
}
