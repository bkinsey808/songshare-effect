import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
// ReactElement is ambient; no import needed

import AddSongToPlaylistSection from "@/react/playlist/add-song/AddSongToPlaylistSection";
import usePlaylistForm from "@/react/playlist/edit/usePlaylistForm";

import usePlaylistDragAndDrop from "./helpers/usePlaylistDragAndDrop";
import PlaylistFormFooter from "./PlaylistFormFooter";
import SortablePlaylistSongItem from "./SortablePlaylistSongItem";

const SONGS_NONE = 0;

/**
 * Playlist edit page component.
 *
 * Renders the form used to create or edit a playlist. This includes controls
 * for changing the playlist name/slug, public/private notes, adding/removing
 * and reordering songs, and submitting or cancelling changes.
 *
 * @returns The playlist edit page UI
 */
export default function PlaylistForm(): ReactElement {
	const {
		formValues,
		isEditing,
		isLoadingData,
		isSaving,
		isSubmitting,
		error,
		setPlaylistSlug, // kept for convenience
		setPublicNotes, // kept for convenience
		setPrivateNotes, // kept for convenience
		handleNameChange, // kept for convenience
		handleFormSubmit,
		handleSongAdded, // kept for convenience
		handleSongRemoved, // kept for convenience
		handleMoveSongUp, // kept for convenience
		handleMoveSongDown, // kept for convenience
		updateSongOrder,
		handleCancel,
		resetForm,
		hasUnsavedChanges,
		formRef,
		t,
	} = usePlaylistForm();

	// Handle DnD
	const { sensors, handleDragEnd, sortableItems } = usePlaylistDragAndDrop({
		songOrder: formValues.song_order,
		setSongOrder: updateSongOrder,
	});

	if (isLoadingData) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="flex items-center space-x-2 text-gray-400">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
					<span>{t("playlistEdit.loading", "Loading playlist...")}</span>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="mx-auto max-w-2xl px-4 py-6 pb-24">
				<h1 className="mb-6 text-2xl font-bold text-white">
					{isEditing
						? t("playlistEdit.titleEdit", "Edit Playlist")
						: t("playlistEdit.titleCreate", "Create New Playlist")}
				</h1>

				{typeof error === "string" && error !== "" && (
					<div className="mb-4 rounded-lg border border-red-600 bg-red-900/20 p-4">
						<p className="text-red-400">{error}</p>
					</div>
				)}

				<form
					ref={formRef}
					onSubmit={(event) => {
						void handleFormSubmit(event);
					}}
					className="space-y-6"
				>
					{/* Playlist Name */}
					<div>
						<label htmlFor="playlist-name" className="mb-2 block text-sm font-medium text-white">
							{t("playlistEdit.name", "Playlist Name")}
						</label>
						<input
							id="playlist-name"
							name="playlist_name"
							type="text"
							value={formValues.playlist_name}
							onChange={(event) => {
								handleNameChange(event.target.value);
							}}
							className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
							placeholder={t("playlistEdit.namePlaceholder", "Enter playlist name")}
							required
							minLength={2}
							maxLength={100}
						/>
					</div>

					{/* Playlist Slug */}
					<div>
						<label htmlFor="playlist-slug" className="mb-2 block text-sm font-medium text-white">
							{t("playlistEdit.slug", "URL Slug")}
						</label>
						<input
							id="playlist-slug"
							name="playlist_slug"
							type="text"
							value={formValues.playlist_slug}
							onChange={(event) => {
								setPlaylistSlug(event.target.value.toLowerCase());
							}}
							className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
							placeholder={t("playlistEdit.slugPlaceholder", "playlist-url-slug")}
							required
							pattern="^[a-z0-9\-]+$"
						/>
						<p className="mt-1 text-xs text-gray-400">
							{t("playlistEdit.slugHint", "Only lowercase letters, numbers, and hyphens")}
						</p>
					</div>

					{/* Public Notes */}
					<div>
						<label htmlFor="public-notes" className="mb-2 block text-sm font-medium text-white">
							{t("playlistEdit.publicNotes", "Public Notes")}
						</label>
						<textarea
							id="public-notes"
							name="public_notes"
							value={formValues.public_notes ?? ""}
							onChange={(event) => {
								setPublicNotes(event.target.value);
							}}
							className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
							placeholder={t("playlistEdit.publicNotesPlaceholder", "Notes visible to everyone")}
							rows={3}
						/>
					</div>

					{/* Private Notes */}
					<div>
						<label htmlFor="private-notes" className="mb-2 block text-sm font-medium text-white">
							{t("playlistEdit.privateNotes", "Private Notes")}
						</label>
						<textarea
							id="private-notes"
							name="private_notes"
							value={formValues.private_notes ?? ""}
							onChange={(event) => {
								setPrivateNotes(event.target.value);
							}}
							className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
							placeholder={t("playlistEdit.privateNotesPlaceholder", "Notes only you can see")}
							rows={3}
						/>
					</div>

					{/* Song Management Section */}
					<div className="space-y-4">
						{/* Add Songs Section */}
						<AddSongToPlaylistSection
							currentSongOrder={[...formValues.song_order]}
							onSongAdded={handleSongAdded}
						/>

						{/* Current Songs List */}
						{formValues.song_order.length > SONGS_NONE && (
							<div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
								<h3 className="mb-4 text-lg font-semibold text-white">
									{t("playlistEdit.currentSongs", "Songs in Playlist")}
								</h3>
								<div className="space-y-2">
									<DndContext
										sensors={sensors}
										collisionDetection={closestCenter}
										onDragEnd={handleDragEnd}
									>
										<SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
											{formValues.song_order.map((songId, index) => (
												<SortablePlaylistSongItem
													key={songId}
													songId={songId}
													index={index}
													totalSongs={formValues.song_order.length}
													onMoveUp={handleMoveSongUp}
													onMoveDown={handleMoveSongDown}
													onRemove={handleSongRemoved}
												/>
											))}
										</SortableContext>
									</DndContext>
								</div>
							</div>
						)}
					</div>
				</form>
			</div>
			<PlaylistFormFooter
				hasChanges={hasUnsavedChanges}
				isSubmitting={isSaving || isSubmitting}
				isEditing={isEditing}
				onSave={() => void handleFormSubmit()}
				onReset={resetForm}
				onCancel={handleCancel}
			/>
		</>
	);
}
