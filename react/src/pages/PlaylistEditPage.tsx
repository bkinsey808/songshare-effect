import { Effect } from "effect";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import type { SavePlaylistRequest } from "@/react/playlist/playlist-types";

import useLocale from "@/react/language/locale/useLocale";
import AddSongToPlaylistSection from "@/react/playlist/add-song/AddSongToPlaylistSection";
import { useAppStore } from "@/react/zustand/useAppStore";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, playlistLibraryPath } from "@/shared/paths";

function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replaceAll(/[^a-z0-9]+/g, "-")
		.replaceAll(/^-+|-+$/g, "");
}

// Playlist edit page component
export default function PlaylistEditPage(): ReactElement {
	const { t } = useTranslation();
	const { lang } = useLocale();
	const navigate = useNavigate();
	const { playlist_id } = useParams<{ playlist_id: string }>();

	const currentPlaylist = useAppStore((state) => state.currentPlaylist);
	const isLoading = useAppStore((state) => state.isPlaylistLoading);
	const isSaving = useAppStore((state) => state.isPlaylistSaving);
	const error = useAppStore((state) => state.playlistError);
	const savePlaylist = useAppStore((state) => state.savePlaylist);
	const clearCurrentPlaylist = useAppStore((state) => state.clearCurrentPlaylist);

	// Form state
	const [playlistName, setPlaylistName] = useState("");
	const [playlistSlug, setPlaylistSlug] = useState("");
	const [publicNotes, setPublicNotes] = useState("");
	const [privateNotes, setPrivateNotes] = useState("");
	const [songOrder, setSongOrder] = useState<string[]>([]);

	// Constants to avoid magic numbers
	const INDEX_FIRST = 0;
	const INDEX_STEP = 1;
	const SONGS_NONE = 0;

	const isEditing = playlist_id !== undefined && playlist_id !== "";

	// Fetch playlist if editing
	useEffect(() => {
		if (isEditing && currentPlaylist?.playlist_id !== playlist_id) {
			// Note: Need a way to fetch by ID, not slug
			// For now, we'll assume the playlist is already loaded or needs to be fetched differently
		}

		return (): void => {
			clearCurrentPlaylist();
		};
	}, [playlist_id, isEditing, currentPlaylist?.playlist_id, clearCurrentPlaylist]);

	// Populate form when playlist loads
	useEffect(() => {
		const cp = currentPlaylist;
		if (cp?.public) {
			setPlaylistName(cp.public.playlist_name);
			setPlaylistSlug(cp.public.playlist_slug);
			setPublicNotes(cp.public.public_notes ?? "");
			setPrivateNotes(cp.private_notes);
			setSongOrder([...(cp.public.song_order ?? [])]);
		}
	}, [currentPlaylist]);

	// Handle name change and auto-generate slug for new playlists.
	function handleNameChange(value: string): void {
		setPlaylistName(value);
		if (!isEditing) {
			setPlaylistSlug(generateSlug(value));
		}
	}

	// Handle form submission
	async function handleSubmit(): Promise<void> {
		let playlistIdForSave: string | undefined = undefined;
		if (isEditing) {
			playlistIdForSave = playlist_id;
		}
		try {
			const request: SavePlaylistRequest = {
				playlist_name: playlistName,
				playlist_slug: playlistSlug,
				public_notes: publicNotes,
				private_notes: privateNotes,
				song_order: songOrder,
			};

			if (playlistIdForSave !== undefined) {
				request.playlist_id = playlistIdForSave;
			}

			const playlistId = await Effect.runPromise(savePlaylist(request));

			// Navigate to playlist library or playlist view
			const libraryPath = buildPathWithLang(`/${dashboardPath}/${playlistLibraryPath}`, lang);
			void navigate(libraryPath);
			console.warn("[PlaylistEditPage] Saved playlist:", playlistId);
		} catch (error) {
			console.error("[PlaylistEditPage] Save failed:", error);
		}
	}

	// Add a song to the playlist
	function handleSongAdded(songId: string): void {
		if (!songOrder.includes(songId)) {
			setSongOrder([...songOrder, songId]);
		}
	}

	// Remove a song from the playlist
	function handleSongRemoved(songId: string): void {
		setSongOrder(songOrder.filter((id) => id !== songId));
	}

	// Move a song up in the order
	function handleMoveSongUp(index: number): void {
		if (index <= INDEX_FIRST) {
			return;
		}
		const newOrder = [...songOrder];
		const prev = newOrder[index - INDEX_STEP];
		const cur = newOrder[index];
		if (prev === undefined || cur === undefined) {
			return;
		}
		[newOrder[index - INDEX_STEP], newOrder[index]] = [cur, prev];
		setSongOrder(newOrder);
	}

	// Move a song down in the order
	function handleMoveSongDown(index: number): void {
		if (index >= songOrder.length - INDEX_STEP) {
			return;
		}
		const newOrder = [...songOrder];
		const cur = newOrder[index];
		const next = newOrder[index + INDEX_STEP];
		if (cur === undefined || next === undefined) {
			return;
		}
		[newOrder[index], newOrder[index + INDEX_STEP]] = [next, cur];
		setSongOrder(newOrder);
	}

	// Cancel and navigate back
	function handleCancel(): void {
		const NAVIGATE_BACK = -1;
		void navigate(NAVIGATE_BACK);
	}

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

	let submitLabel = "";
	if (isSaving) {
		submitLabel = t("playlistEdit.saving", "Saving...");
	} else if (isEditing) {
		submitLabel = t("playlistEdit.save", "Save Changes");
	} else {
		submitLabel = t("playlistEdit.create", "Create Playlist");
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
