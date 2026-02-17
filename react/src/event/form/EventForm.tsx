import { type ReactElement } from "react";
import { useTranslation } from "react-i18next";

import DateTimePicker from "@/react/lib/design-system/date-time-picker/DateTimePicker";

import PlaylistSearchInput from "../playlist-search-input/PlaylistSearchInput";
import ActiveSongSelectionSection from "./ActiveSongSelectionSection";
import EventFormFooter from "./EventFormFooter";
import EventFormHeader from "./EventFormHeader";
import useEventForm from "./useEventForm";

/**
 * Event creation/edit form component.
 *
 * Renders a form for creating or editing an event with fields for:
 * - Event name and unique slug
 * - Description and date
 * - Public/private toggle
 * - Active playlist selection (inline search) and active song selection
 * - Public and private notes
 *
 * @returns The event form UI
 */
export default function EventForm(): ReactElement {
	const { t } = useTranslation();

	const {
		formValues,
		isEditing,
		isSaving,
		isSubmitting,
		isPlaylistLibraryLoading,
		hasNoPlaylists,
		submitLabel,
		error,
		handleNameChange,
		handleDescriptionChange,
		handleDateChange,
		handleIsPublicChange,
		handlePlaylistSelect,
		handleActiveSongSelect,
		handleActiveSlidePositionSelect,
		setEventSlug,
		setPublicNotes,
		setPrivateNotes,
		handleFormSubmit,
		handleCancel,
		resetForm,
		hasUnsavedChanges,
		formRef,
	} = useEventForm();

	return (
		<>
			<div className="mx-auto max-w-2xl px-4 py-6 pb-24">
				<EventFormHeader isEditing={isEditing} error={error} />

				<form
					ref={formRef}
					onSubmit={(event) => {
						void handleFormSubmit(event);
					}}
					className="space-y-6"
				>
					{/* Event Name */}
					<div>
						<label htmlFor="event-name" className="mb-2 block text-sm font-medium text-white">
							{t("eventEdit.name", "Event Name")}
						</label>
						<input
							id="event-name"
							name="event_name"
							type="text"
							value={formValues.event_name}
							onChange={(event) => {
								handleNameChange(event.target.value);
							}}
							className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
							placeholder={t("eventEdit.namePlaceholder", "Enter event name")}
							required
							minLength={2}
							maxLength={100}
						/>
					</div>

					{/* Event Slug */}
					<div>
						<label htmlFor="event-slug" className="mb-2 block text-sm font-medium text-white">
							{t("eventEdit.slug", "URL Slug")}
						</label>
						<input
							id="event-slug"
							name="event_slug"
							type="text"
							value={formValues.event_slug}
							onChange={(event) => {
								setEventSlug(event.target.value.toLowerCase());
							}}
							className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
							placeholder={t("eventEdit.slugPlaceholder", "event-url-slug")}
							required
							pattern="^[a-z0-9-]+$"
						/>
						<p className="mt-1 text-xs text-gray-400">
							{t("eventEdit.slugHint", "Only lowercase letters, numbers, and hyphens")}
						</p>
					</div>

					{/* Event Description */}
					<div>
						<label
							htmlFor="event-description"
							className="mb-2 block text-sm font-medium text-white"
						>
							{t("eventEdit.description", "Description")}
						</label>
						<textarea
							id="event-description"
							name="event_description"
							value={formValues.event_description ?? ""}
							onChange={(event) => {
								handleDescriptionChange(event.target.value);
							}}
							className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
							placeholder={t("eventEdit.descriptionPlaceholder", "Event description")}
							rows={3}
						/>
					</div>

					{/* Event Date */}
					<DateTimePicker
						value={formValues.event_date ?? ""}
						onChange={handleDateChange}
						label={t("eventEdit.date", "Event Date")}
						placeholder="YYYY/MM/DD HH:mm"
						disablePastDates={!isEditing}
					/>

					<PlaylistSearchInput
						activePlaylistId={formValues.active_playlist_id}
						onSelect={handlePlaylistSelect}
						label={t("eventEdit.activePlaylist", "Active Playlist")}
						placeholder={t("eventEdit.activePlaylistPlaceholder", "Search playlists...")}
					/>
					{!isPlaylistLibraryLoading && hasNoPlaylists && (
						<p className="-mt-4 text-xs text-gray-400">
							{t("eventEdit.noPlaylistsHint", "No playlists in your library yet")}
						</p>
					)}

					<ActiveSongSelectionSection
						activePlaylistId={formValues.active_playlist_id}
						activeSongId={formValues.active_song_id}
						activeSlidePosition={formValues.active_slide_position}
						onSelectActiveSong={handleActiveSongSelect}
						onSelectActiveSlidePosition={handleActiveSlidePositionSelect}
					/>

					{/* Public Toggle */}
					<div className="flex items-center space-x-3 rounded-lg border border-gray-600 bg-gray-800 p-4">
						<input
							id="is-public"
							name="is_public"
							type="checkbox"
							checked={formValues.is_public ?? false}
							onChange={(event) => {
								handleIsPublicChange(event.target.checked);
							}}
							className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
						/>
						<label htmlFor="is-public" className="text-sm font-medium text-white">
							{t("eventEdit.isPublic", "Make event public and discoverable")}
						</label>
					</div>

					{/* Public Notes */}
					<div>
						<label htmlFor="public-notes" className="mb-2 block text-sm font-medium text-white">
							{t("eventEdit.publicNotes", "Public Notes")}
						</label>
						<textarea
							id="public-notes"
							name="public_notes"
							value={formValues.public_notes ?? ""}
							onChange={(event) => {
								setPublicNotes(event.target.value);
							}}
							className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
							placeholder={t("eventEdit.publicNotesPlaceholder", "Notes visible to everyone")}
							rows={3}
						/>
					</div>

					{/* Private Notes */}
					<div>
						<label htmlFor="private-notes" className="mb-2 block text-sm font-medium text-white">
							{t("eventEdit.privateNotes", "Private Notes")}
						</label>
						<textarea
							id="private-notes"
							name="private_notes"
							value={formValues.private_notes ?? ""}
							onChange={(event) => {
								setPrivateNotes(event.target.value);
							}}
							className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
							placeholder={t("eventEdit.privateNotesPlaceholder", "Notes only you can see")}
							rows={3}
						/>
					</div>
				</form>
			</div>

			<EventFormFooter
				isSaving={isSaving}
				isSubmitting={isSubmitting}
				submitLabel={submitLabel}
				hasUnsavedChanges={hasUnsavedChanges}
				handleFormSubmit={handleFormSubmit}
				resetForm={resetForm}
				handleCancel={handleCancel}
			/>
		</>
	);
}
