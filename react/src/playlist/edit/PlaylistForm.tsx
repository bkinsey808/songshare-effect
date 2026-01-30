import AddSongToPlaylistSection from "@/react/playlist/add-song/AddSongToPlaylistSection";
import usePlaylistForm from "@/react/playlist/edit/usePlaylistForm";

// Constants to avoid magic numbers
const INDEX_FIRST = 0;
const INDEX_STEP = 1;
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
		playlistName,
		playlistSlug,
		publicNotes,
		privateNotes,
		songOrder,
		isEditing,
		isLoading,
		isSaving,
		error,
		setPlaylistSlug,
		setPublicNotes,
		setPrivateNotes,
		handleNameChange,
		handleSubmit,
		handleSongAdded,
		handleSongRemoved,
		handleMoveSongUp,
		handleMoveSongDown,
		handleCancel,
		submitLabel,
		t,
	} = usePlaylistForm();

	if (isLoading) {
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
		<div className="mx-auto max-w-2xl px-4 py-6">
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
				onSubmit={(event) => {
					event.preventDefault();
					void handleSubmit();
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
						type="text"
						value={playlistName}
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
						type="text"
						value={playlistSlug}
						onChange={(event) => {
							setPlaylistSlug(event.target.value.toLowerCase());
						}}
						className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
						placeholder={t("playlistEdit.slugPlaceholder", "playlist-url-slug")}
						required
						pattern="^[a-z0-9-]+$"
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
						value={publicNotes}
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
						value={privateNotes}
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
					<AddSongToPlaylistSection currentSongOrder={songOrder} onSongAdded={handleSongAdded} />

					{/* Current Songs List */}
					{songOrder.length > SONGS_NONE && (
						<div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
							<h3 className="mb-4 text-lg font-semibold text-white">
								{t("playlistEdit.currentSongs", "Songs in Playlist")}
							</h3>
							<div className="space-y-2">
								{songOrder.map((songId, index) => (
									<div
										key={songId}
										className="flex items-center justify-between rounded-lg border border-gray-600 bg-gray-700 p-3"
									>
										<div className="flex items-center gap-3">
											<span className="w-6 text-center text-gray-400">{index + INDEX_STEP}</span>
											<span className="text-white">
												{/* Note: Display song name from song library */}
												{songId}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => {
													handleMoveSongUp(index);
												}}
												disabled={index === INDEX_FIRST}
												className="rounded p-1 text-gray-400 hover:bg-gray-600 hover:text-white disabled:opacity-30"
												title={t("playlistEdit.moveUp", "Move up")}
											>
												<svg
													className="size-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M5 15l7-7 7 7"
													/>
												</svg>
											</button>
											<button
												type="button"
												onClick={() => {
													handleMoveSongDown(index);
												}}
												disabled={index === songOrder.length - INDEX_STEP}
												className="rounded p-1 text-gray-400 hover:bg-gray-600 hover:text-white disabled:opacity-30"
												title={t("playlistEdit.moveDown", "Move down")}
											>
												<svg
													className="size-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M19 9l-7 7-7-7"
													/>
												</svg>
											</button>
											<button
												type="button"
												onClick={() => {
													handleSongRemoved(songId);
												}}
												className="rounded p-1 text-red-400 hover:bg-red-900/30 hover:text-red-300"
												title={t("playlistEdit.remove", "Remove")}
											>
												<svg
													className="size-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											</button>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<div className="flex items-center justify-end space-x-4">
					<button
						type="button"
						onClick={handleCancel}
						className="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-800"
					>
						{t("playlistEdit.cancel", "Cancel")}
					</button>
					<button
						type="submit"
						disabled={isSaving}
						className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{submitLabel}
					</button>
				</div>
			</form>
		</div>
	);
}
