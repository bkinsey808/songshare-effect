import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import PlaylistSongDisplay from "@/react/event/view/playlist-song-display/PlaylistSongDisplay";
import ShareButton from "@/react/lib/design-system/share-button/ShareButton";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPublicWebUrl from "@/react/lib/qr-code/buildPublicWebUrl";
import CollapsibleQrCode from "@/react/lib/qr-code/CollapsibleQrCode";
import SharedUsersSection from "@/react/share/shared-users-section/SharedUsersSection";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, playlistEditPath, playlistViewPath, songViewPath } from "@/shared/paths";
import formatAppDate from "@/shared/utils/formatAppDate";

import { Effect } from "effect";

import fetchItemTagsEffect from "@/react/tag-library/image/fetchItemTagsRequest";
import TagList from "@/react/tag-library/TagList";

import PlaylistViewLibraryAction from "../playlist-view/PlaylistViewLibraryAction";
import usePlaylistView from "./usePlaylistView";

const SONGS_NONE = 0;

/**
 * Renders the public view of a playlist by slug.
 *
 * Handles loading, error, and not-found states. Fetches playlist on mount,
 * auto-adds the owner to user library, and displays songs with links to each.
 *
 * @returns React element (playlist view, loading, error, or not-found)
 */
export default function PlaylistView(): ReactElement {
	const { t } = useTranslation();
	const { lang } = useLocale();
	const { currentPlaylist, playlistPublic, publicSongs, isLoading, error, isOwner, songOrder } =
		usePlaylistView();
	const [tags, setTags] = useState<string[]>([]);

	// Load the playlist's tags for display.
	useEffect(() => {
		if (currentPlaylist === undefined) { return; }
		void (async (): Promise<void> => {
			setTags(await Effect.runPromise(fetchItemTagsEffect("playlist", currentPlaylist.playlist_id)));
		})();
	}, [currentPlaylist]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="flex items-center space-x-2 text-gray-400">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
					<span>{t("playlist.loading", "Loading playlist...")}</span>
				</div>
			</div>
		);
	}

	if (typeof error === "string" && error !== "") {
		return (
			<div className="mx-auto max-w-4xl px-4 py-6">
				<div className="rounded-lg border border-red-600 bg-red-900/20 p-4">
					<div className="flex items-center space-x-2">
						<div className="text-red-400">⚠️</div>
						<div>
							<h3 className="font-semibold text-red-300">
								{t("playlist.errorTitle", "Error Loading Playlist")}
							</h3>
							<p className="text-red-400">{error}</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!playlistPublic || currentPlaylist === undefined) {
		return (
			<div className="mx-auto max-w-4xl px-4 py-6">
				<div className="py-12 text-center">
					<div className="mb-4 text-6xl">📋</div>
					<h2 className="mb-2 text-xl font-semibold text-white">
						{t("playlist.notFound", "Playlist not found")}
					</h2>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl px-4 py-6">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-start justify-between">
					<div>
						<h1 className="mb-2 text-3xl font-bold text-white">{playlistPublic.playlist_name}</h1>
						{currentPlaylist.owner_username !== undefined && (
							<p className="text-gray-400">
								{t("playlist.by", "by {{username}}", {
									username: currentPlaylist.owner_username,
								})}
							</p>
						)}
					</div>
					<div className="flex items-center gap-3">
						<PlaylistViewLibraryAction
							playlistId={currentPlaylist.playlist_id}
							playlistOwnerId={currentPlaylist.user_id}
						/>
						<ShareButton
							itemType="playlist"
							itemId={currentPlaylist.playlist_id}
							itemName={playlistPublic.playlist_name}
						/>
						{isOwner && (
							<Link
								to={buildPathWithLang(
									`/${dashboardPath}/${playlistEditPath}/${currentPlaylist.playlist_id}`,
									lang,
								)}
								className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
							>
								{t("playlist.edit", "Edit Playlist")}
							</Link>
						)}
					</div>
				</div>

				{playlistPublic.playlist_slug !== undefined && playlistPublic.playlist_slug !== "" && (
					<div className="mt-4">
						<CollapsibleQrCode
							url={buildPublicWebUrl(`/${playlistViewPath}/${playlistPublic.playlist_slug}`, lang)}
							label={playlistPublic.playlist_name}
						/>
					</div>
				)}

				{/* Public Notes */}
				{typeof playlistPublic.public_notes === "string" &&
					playlistPublic.public_notes.trim() !== "" && (
						<div className="mt-4 rounded-lg bg-gray-800 p-4">
							<p className="whitespace-pre-wrap text-gray-300">{playlistPublic.public_notes}</p>
						</div>
					)}
				{/* Stats */}
				<div className="mt-4 flex items-center space-x-4 text-sm text-gray-400">
					<span>{t("playlist.songCount", "{{count}} songs", { count: songOrder.length })}</span>
					{typeof playlistPublic.created_at === "string" && playlistPublic.created_at !== "" && (
						<span>
							{t("playlist.created", "Created {{date}}", {
								date: formatAppDate(playlistPublic.created_at),
							})}
						</span>
					)}
				</div>
			</div>

			<TagList slugs={tags} />

			{/* Song List */}
			<div className="space-y-2">
				<h2 className="mb-4 text-xl font-semibold text-white">{t("playlist.songs", "Songs")}</h2>

				{songOrder.length === SONGS_NONE ? (
					<div className="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center">
						<p className="text-gray-400">
							{t("playlist.noSongs", "This playlist has no songs yet.")}
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{songOrder.map((songId: string, index: number) => (
							<div key={songId} className="flex items-center gap-4">
								<div className="min-w-0 flex-1">
									<PlaylistSongDisplay songId={songId} index={index} publicSongs={publicSongs} />
								</div>
								<Link
									to={buildPathWithLang(`/${songViewPath}/${songId}`, lang)}
									className="shrink-0 text-sm text-blue-400 hover:text-blue-300"
								>
									{t("playlist.viewSong", "View")}
								</Link>
							</div>
						))}
					</div>
				)}
			</div>

			<SharedUsersSection
				itemType="playlist"
				itemId={currentPlaylist.playlist_id}
				itemName={playlistPublic.playlist_name}
			/>
		</div>
	);
}
