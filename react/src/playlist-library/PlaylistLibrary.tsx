import type { TFunction } from "i18next";

import { Link } from "react-router-dom";

import type { SupportedLanguageType } from "@/shared/language/supported-languages";

import { useAppStore } from "@/react/zustand/useAppStore";
import { ZERO } from "@/shared/constants/shared-constants";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, playlistEditPath, playlistViewPath } from "@/shared/paths";
import formatAppDate from "@/shared/utils/formatAppDate";

import usePlaylistLibrary from "./usePlaylistLibrary";

export type PlaylistLibraryProps = {
	lang: SupportedLanguageType;
	/** Translation function `t` from i18next */
	t: TFunction;
	navigate: (to: string) => void;
};

/**
 * PlaylistLibrary component — renders the current user's playlist library.
 *
 * This component selects library state from the app store, and renders
 * loading, error, empty, or the playlist grid. Each entry exposes actions
 * to view the playlist or remove it from the library.
 *
 * @param props - Component props.
 * @returns The playlist library UI.
 */
export default function PlaylistLibrary({ lang, t, navigate }: PlaylistLibraryProps): ReactElement {
	const { playlistEntries, isLoading, error, removeFromPlaylistLibrary } = usePlaylistLibrary();
	const currentUserId = useAppStore((state) => state.userSessionData?.user.user_id);

	console.warn("[PlaylistLibrary] Render state:", {
		entriesCount: playlistEntries.length,
		isLoading,
		error,
		firstEntryId: playlistEntries[ZERO]?.playlist_id ?? "none",
		firstEntryName: playlistEntries[ZERO]?.playlist_name ?? "none",
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="flex items-center space-x-2 text-gray-400">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
					<span>{t("playlistLibrary.loading", "Loading your playlist library...")}</span>
				</div>
			</div>
		);
	}

	if (typeof error === "string" && error !== "") {
		return (
			<div className="rounded-lg border border-red-600 bg-red-900/20 p-4">
				<div className="flex items-center space-x-2">
					<div className="text-red-400">⚠️</div>
					<div>
						<h3 className="font-semibold text-red-300">
							{t("playlistLibrary.errorTitle", "Error Loading Library")}
						</h3>
						<p className="text-red-400">{error}</p>
					</div>
				</div>
			</div>
		);
	}

	if (playlistEntries.length === ZERO) {
		return (
			<div className="py-12 text-center">
				<div className="mb-4 text-6xl">📋</div>
				<h2 className="mb-2 text-xl font-semibold text-white">
					{t("playlistLibrary.emptyTitle", "Your playlist library is empty")}
				</h2>
				<p className="mb-6 text-gray-400">
					{t(
						"playlistLibrary.emptyDescription",
						"Start building your collection by creating playlists or adding others' playlists!",
					)}
				</p>
				<div className="text-sm text-gray-500">
					{t(
						"playlistLibrary.emptyHint",
						"Create a playlist or browse playlists to add them to your library",
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header Stats */}
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold text-white">
					{t("playlistLibrary.libraryTitle", "My Playlist Library")}
				</h2>
				<div className="flex items-center space-x-4 text-sm text-gray-400">
					<div>
						{t("playlistLibrary.playlistCount", "{{count}} playlists", {
							count: playlistEntries.length,
						})}
					</div>
				</div>
			</div>

			{/* Playlist Grid */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{playlistEntries.map((entry) => (
					<div
						key={entry.playlist_id}
						className="group hover:bg-gray-750 rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-gray-600"
					>
						{/* Playlist Title */}
						<h3 className="mb-2 line-clamp-2 font-semibold text-white">
							{entry.playlist_name ?? t("playlistLibrary.untitled", "Untitled Playlist")}
						</h3>

						{/* Owner Info */}
						<div className="mb-3 flex items-center space-x-2">
							<div className="flex items-center space-x-1 text-sm text-gray-400">
								<span>👤</span>
								<span>
									{typeof entry.owner_username === "string" && entry.owner_username !== ""
										? entry.owner_username
										: t("playlistLibrary.unknownOwner", "Unknown User")}
								</span>
							</div>
						</div>

						{/* Added Date */}
						<div className="mb-4 text-xs text-gray-400">
							{t("playlistLibrary.addedOn", "Added {{date}}", {
								date: formatAppDate(entry.created_at),
							})}
						</div>

						{/* Action Buttons */}
						<div className="flex items-center justify-between gap-2">
							{entry.playlist_slug !== undefined && entry.playlist_slug.trim() !== "" ? (
								<Link
									to={buildPathWithLang(`/${playlistViewPath}/${entry.playlist_slug}`, lang)}
									className="text-sm text-blue-400 transition-colors hover:text-blue-300"
								>
									{t("playlistLibrary.viewPlaylist", "View Playlist")}
								</Link>
							) : (
								<span className="cursor-not-allowed text-sm text-gray-500">
									{t("playlistLibrary.viewPlaylist", "View Playlist")}
								</span>
							)}
							{currentUserId !== undefined && currentUserId === entry.playlist_owner_id ? (
								<button
									type="button"
									className="text-sm text-green-400 transition-colors hover:text-green-300"
									onClick={() => {
										navigate(`/${lang}/${dashboardPath}/${playlistEditPath}/${entry.playlist_id}`);
									}}
								>
									{t("playlistLibrary.editPlaylist", "Edit")}
								</button>
							) : undefined}
							{currentUserId !== undefined && currentUserId !== entry.playlist_owner_id ? (
								<button
									type="button"
									className="text-sm text-red-400 transition-colors hover:text-red-300"
									onClick={() => {
										void removeFromPlaylistLibrary({ playlist_id: entry.playlist_id });
									}}
								>
									{t("playlistLibrary.removePlaylist", "Remove")}
								</button>
							) : undefined}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
