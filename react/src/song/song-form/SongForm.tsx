// src/features/song-form/SongForm.tsx
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { songFields } from "../song-schema";
import SlidesViewManager from "./SlidesViewManager";
import useSongForm from "./useSongForm";

export function SongForm(): ReactElement {
	const songId = useParams<{ song_id?: string }>().song_id;
	const { t } = useTranslation();

	// Use only ONE instance of useSongForm
	const {
		getFieldError,
		isSubmitting,
		slideOrder,
		slides,
		fields,
		slug,
		setSlideOrder,
		setSlides,
		toggleField,
		handleFormSubmit,
		formRef,
	} = useSongForm();

	// Create refs for form fields
	const songNameRef = useRef<HTMLInputElement>(null);
	const songSlugRef = useRef<HTMLInputElement>(null);
	const shortCreditRef = useRef<HTMLInputElement>(null);

	const handleSongNameBlur = (): void => {
		const name = songNameRef.current?.value?.trim();
		if ((name?.length ?? 0) > 0 && (slug?.length ?? 0) === 0) {
			// Simple slugify: lowercase, replace spaces with dashes, remove non-alphanumeric except dashes
			const generatedSlug = (name ?? "")
				.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, "")
				.replace(/\s+/g, "-")
				.replace(/-+/g, "-")
				.replace(/^-/, "")
				.replace(/-$/, "");

			if (songSlugRef.current) {
				songSlugRef.current.value = generatedSlug;
			}
		}
	};

	return (
		<div className="w-full">
			<h1>{(songId?.length ?? 0) > 0 ? "Edit" : "Create"} Song Form</h1>
			<form
				ref={formRef}
				className="flex w-full flex-col gap-4"
				onSubmit={handleFormSubmit}
			>
				<label className="flex flex-col gap-1">
					{t("song.songName", "Song Name")}
					<input
						ref={songNameRef}
						type="text"
						name="song_name"
						className="w-full rounded border px-2 py-1"
						onBlur={handleSongNameBlur}
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
						ref={songSlugRef}
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
						ref={shortCreditRef}
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

				{/* Pass selected fields and slide state to SlidesViewManager */}
				<SlidesViewManager
					fields={fields}
					slideOrder={slideOrder}
					setSlideOrder={setSlideOrder}
					slides={slides}
					setSlides={setSlides}
				/>

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

				<button
					type="submit"
					className="w-full rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
					disabled={isSubmitting}
				>
					{(songId?.length ?? 0) > 0
						? t("song.updateSong", "Update Song")
						: t("song.createSong", "Create Song")}
				</button>
			</form>
		</div>
	);
}
