import { useTranslation } from "react-i18next";

import FormField from "@/react/lib/design-system/form/FormField";
import FormInput from "@/react/lib/design-system/form/FormInput";
import FormSection from "@/react/lib/design-system/form/FormSection";
import FormTextarea from "@/react/lib/design-system/form/FormTextarea";
import TagInput from "@/react/tag/input/TagInput";
import type { SongKey } from "@/shared/song/songKeyOptions";
import BoxedLanguageField from "./BoxedLanguageField";
import MultiLanguagePicker from "./language-picker/MultiLanguagePicker";
import SongChordsField from "./SongChordsField";
import SongKeyFormField from "./SongKeyFormField";
const PICKER_BOX_CLASS = "rounded border border-gray-600 bg-gray-900/60 px-3 py-3";

type SongFormFieldsProps = Readonly<{
	getFieldError: (
		fieldName: keyof {
			song_name: string;
			song_slug: string;
			lyrics: readonly string[];
			script: readonly string[];
			key?: SongKey;
			short_credit?: string;
			long_credit?: string;
			translations: readonly string[];
		},
	) => { message: string; params?: Record<string, unknown> } | undefined;
	onSongNameBlur: () => void;
	songNameRef: React.RefObject<HTMLInputElement | null>;
	songSlugRef: React.RefObject<HTMLInputElement | null>;
	formValues: {
		song_name: string;
		song_slug: string;
		lyrics: readonly string[];
		script: readonly string[];
		translations: readonly string[];
		chords: readonly string[];
		key: SongKey | "";
		short_credit: string;
		long_credit: string;
		public_notes: string;
		private_notes: string;
	};
	setFormValue: <Field extends keyof SongFormFieldsProps["formValues"]>(
		field: Field,
		value: SongFormFieldsProps["formValues"][Field],
	) => void;
	tags: readonly string[];
	setTags: (tags: string[]) => void;
	onKeyChange: (key: SongKey | "") => void;
	lyricChords: readonly string[];
	onOpenSongChordPicker: () => void;
	onEditSongChord: (token: string) => void;
	onRemoveSongChord: (token: string) => void;
}>;

/**
 * Renders the form fields used in the Song editor.
 * @param getFieldError - Function to resolve validation errors for a field
 * @param onSongNameBlur - Called when the song name field is blurred (used to generate slug)
 * @param songNameRef - Ref to the song name input
 * @param songSlugRef - Ref to the song slug input
 * @param formValues - Controlled form values
 * @param setFormValue - Setter for individual form values
 * @param tags - Current tag values for the song
 * @param setTags - Setter to update the tag list
 * @param onKeyChange - Called when the song key changes; converts existing chords to the new key
 * @param lyricChords - Chord tokens currently present in lyrics, in presentation order
 * @param onOpenSongChordPicker - Opens the full-page picker to add a song-level chord
 * @param onEditSongChord - Opens the full-page picker to edit an unused song-level chord
 * @param onRemoveSongChord - Removes a song-level chord that is not currently present in lyrics
 * @returns React element rendering the set of fields for the song form
 */
export default function SongFormFields({
	getFieldError,
	onSongNameBlur,
	songNameRef,
	songSlugRef,
	formValues,
	setFormValue,
	tags,
	setTags,
	onKeyChange,
	lyricChords,
	onOpenSongChordPicker,
	onEditSongChord,
	onRemoveSongChord,
}: SongFormFieldsProps): ReactElement {
	const { t } = useTranslation();
	/**
	 * Handle updates to the song name input.
	 *
	 * @param event - Change event from the song name input
	 * @returns void
	 */
	function handleSongNameChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setFormValue("song_name", event.target.value);
	}
	/**
	 * Handle updates to the song slug input.
	 *
	 * @param event - Change event from the song slug input
	 * @returns void
	 */
	function handleSongSlugChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setFormValue("song_slug", event.target.value);
	}
	/**
	 * Handle updates to the short credit input.
	 *
	 * @param event - Change event from the short credit input
	 * @returns void
	 */
	function handleShortCreditChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setFormValue("short_credit", event.target.value);
	}
	/**
	 * Handle updates to the long credit textarea.
	 *
	 * @param event - Change event from the long credit textarea
	 * @returns void
	 */
	function handleLongCreditChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		setFormValue("long_credit", event.target.value);
	}
	/**
	 * Handle updates to the public notes textarea.
	 *
	 * @param event - Change event from the public notes textarea
	 * @returns void
	 */
	function handlePublicNotesChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		setFormValue("public_notes", event.target.value);
	}
	/**
	 * Handle updates to the private notes textarea.
	 *
	 * @param event - Change event from the private notes textarea
	 * @returns void
	 */
	function handlePrivateNotesChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		setFormValue("private_notes", event.target.value);
	}

	return (
		<FormSection>
			<FormField
				label={t("song.songName", "Song Name")}
				error={(() => {
					const songNameError = getFieldError("song_name");
					return songNameError
						? t(songNameError.message, {
								...songNameError.params,
								defaultValue: songNameError.message,
							})
						: undefined;
				})()}
			>
				<FormInput
					ref={songNameRef}
					name="song_name"
					value={formValues.song_name}
					onChange={handleSongNameChange}
					onBlur={onSongNameBlur}
				/>
			</FormField>

			<FormField
				label={t("song.songSlug", "Song Slug")}
				error={(() => {
					const songSlugError = getFieldError("song_slug");
					return songSlugError
						? t(songSlugError.message, {
								...songSlugError.params,
								defaultValue: songSlugError.message,
							})
						: undefined;
				})()}
			>
				<FormInput
					ref={songSlugRef}
					name="song_slug"
					value={formValues.song_slug}
					onChange={handleSongSlugChange}
				/>
			</FormField>

			<BoxedLanguageField
				label={t("song.lyricsLanguage", "Lyrics Language")}
				error={getFieldError("lyrics")}
				value={formValues.lyrics}
				onChange={(codes) => {
					setFormValue("lyrics", codes);
				}}
				excludedCodes={formValues.script}
				placeholder={t("song.languagePicker.addLyrics", "Add lyrics language...")}
				emptyText={t("song.languagePicker.emptyLyrics", "No lyrics languages selected.")}
			/>

			<BoxedLanguageField
				label={t("song.scriptLanguage", "Script Language")}
				error={getFieldError("script")}
				value={formValues.script}
				onChange={(codes) => {
					setFormValue("script", codes);
				}}
				excludedCodes={formValues.lyrics}
				placeholder={t("song.languagePicker.addScript", "Add script language...")}
				emptyText={t("song.languagePicker.emptyScript", "No script languages selected.")}
			/>

			<FormField
				label={t("song.translationLanguages", "Translation Languages")}
				as="fieldset"
				error={(() => {
					const translationsError = getFieldError("translations");
					return translationsError
						? t(translationsError.message, {
								...translationsError.params,
								defaultValue: translationsError.message,
							})
						: undefined;
				})()}
			>
				<div className={PICKER_BOX_CLASS}>
					<MultiLanguagePicker
						value={formValues.translations}
						onChange={(codes) => {
							setFormValue("translations", codes);
						}}
						excludedCodes={[...formValues.lyrics, ...formValues.script]}
						placeholder={t(
							"song.translationLanguagePicker.addPlaceholder",
							"Add translation language...",
						)}
						emptyText={t(
							"song.translationLanguagePicker.empty",
							"No translation languages selected yet.",
						)}
					/>
				</div>
			</FormField>

			<SongKeyFormField
				getFieldError={getFieldError}
				value={formValues.key}
				onChange={onKeyChange}
			/>

			<SongChordsField
				chords={formValues.chords}
				songKey={formValues.key}
				lyricChords={lyricChords}
				onOpenSongChordPicker={onOpenSongChordPicker}
				onEditSongChord={onEditSongChord}
				onRemoveSongChord={onRemoveSongChord}
			/>

			<FormField
				label={t("song.shortCredit", "Short Credit")}
				error={(() => {
					const shortCreditError = getFieldError("short_credit");
					return shortCreditError
						? t(shortCreditError.message, {
								...shortCreditError.params,
								defaultValue: shortCreditError.message,
							})
						: undefined;
				})()}
			>
				<FormInput
					name="short_credit"
					value={formValues.short_credit}
					onChange={handleShortCreditChange}
				/>
			</FormField>

			<FormField label={t("song.longCredit", "Long Credit")}>
				<FormTextarea
					name="long_credit"
					value={formValues.long_credit}
					onChange={handleLongCreditChange}
					placeholder="Enter long credit..."
					autoExpand
				/>
			</FormField>

			<FormField label={t("song.publicNotes", "Public Notes")}>
				<FormTextarea
					name="public_notes"
					value={formValues.public_notes}
					onChange={handlePublicNotesChange}
					placeholder="Enter public notes..."
					autoExpand
				/>
			</FormField>

			<FormField label={t("song.privateNotes", "Private Notes")}>
				<FormTextarea
					name="private_notes"
					value={formValues.private_notes}
					onChange={handlePrivateNotesChange}
					placeholder="Enter private notes..."
					autoExpand
				/>
			</FormField>

			<FormField as="fieldset" label={t("song.tags", "Tags")}>
				<TagInput value={tags} onChange={setTags} />
			</FormField>
		</FormSection>
	);
}
