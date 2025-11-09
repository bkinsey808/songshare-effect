import { useTranslation } from "react-i18next";

import { songFields } from "../song-schema";

type SongFormFieldsProps = Readonly<{
	getFieldError: (
		fieldName: keyof {
			song_name: string;
			song_slug: string;
			short_credit?: string;
			long_credit?: string;
		},
	) => { message: string; params?: Record<string, unknown> } | undefined;
	fields: string[];
	toggleField: (field: string, checked: boolean) => void;
	onSongNameBlur: () => void;
}>;

export default function SongFormFields({
	getFieldError,
	fields,
	toggleField,
	onSongNameBlur,
}: SongFormFieldsProps): ReactElement {
	const { t } = useTranslation();

	return (
		<>
			<label className="flex flex-col gap-1">
				{t("song.songName", "Song Name")}
				<input
					type="text"
					name="song_name"
					className="w-full rounded border px-2 py-1"
					onBlur={onSongNameBlur}
				/>
				{(() => {
					const songNameError = getFieldError("song_name");
					return (
						songNameError && (
							<span className="text-sm text-red-600">
								{t(songNameError.message, {
									...songNameError.params,
									defaultValue: songNameError.message,
								})}
							</span>
						)
					);
				})()}
			</label>

			<label className="flex flex-col gap-1">
				{t("song.songSlug", "Song Slug")}
				<input
					type="text"
					name="song_slug"
					className="w-full rounded border px-2 py-1"
				/>
				{(() => {
					const songSlugError = getFieldError("song_slug");
					return (
						songSlugError && (
							<span className="text-sm text-red-600">
								{t(songSlugError.message, {
									...songSlugError.params,
									defaultValue: songSlugError.message,
								})}
							</span>
						)
					);
				})()}
			</label>

			<label className="flex flex-col gap-1">
				{t("song.shortCredit", "Short Credit")}
				<input
					type="text"
					name="short_credit"
					className="w-full rounded border px-2 py-1"
				/>
				{(() => {
					const shortCreditError = getFieldError("short_credit");
					return (
						shortCreditError && (
							<span className="text-sm text-red-600">
								{t(shortCreditError.message, {
									...shortCreditError.params,
									defaultValue: shortCreditError.message,
								})}
							</span>
						)
					);
				})()}
			</label>

			<label className="flex flex-col gap-1">
				{t("song.longCredit", "Long Credit")}
				<textarea
					rows={4}
					name="long_credit"
					className="w-full rounded border px-2 py-1"
				/>
			</label>

			<fieldset className="flex flex-col gap-2">
				<legend className="font-semibold">Fields</legend>
				{songFields.map((field) => (
					<label key={field} className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={fields.includes(field)}
							onChange={(event) => toggleField(field, event.target.checked)}
						/>
						{t(`song.${field}`, field)}
					</label>
				))}
			</fieldset>

			<label className="flex flex-col gap-1">
				{t("song.publicNotes", "Public Notes")}
				<textarea
					rows={4}
					name="public_notes"
					className="w-full rounded border px-2 py-1"
				/>
			</label>

			<label className="flex flex-col gap-1">
				{t("song.privateNotes", "Private Notes")}
				<textarea
					rows={4}
					name="private_notes"
					className="w-full rounded border px-2 py-1"
				/>
			</label>
		</>
	);
}
