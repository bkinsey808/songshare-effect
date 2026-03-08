import { Effect } from "effect";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import useAppStore, { getTypedState } from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import PlaylistSongDisplay from "@/react/event/view/playlist-song-display/PlaylistSongDisplay";
import ShareButton from "@/react/lib/design-system/ShareButton";
import useLocale from "@/react/lib/language/locale/useLocale";
import SharedUsersSection from "@/react/share/shared-users-section/SharedUsersSection";
import useShareSubscription from "@/react/share/subscribe/useShareSubscription";
import addUserToLibraryEffect from "@/react/user-library/user-add/addUserToLibraryEffect";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, playlistEditPath, songViewPath } from "@/shared/paths";
import formatAppDate from "@/shared/utils/formatAppDate";

const SONGS_NONE = 0;

/**
 * Page component for viewing a playlist by slug.
 *
 * @returns The playlist view page
 */
export default function PlaylistPage(): ReactElement {
	const { t } = useTranslation();
	const { lang } = useLocale();
	const { playlist_slug } = useParams<{ playlist_slug: string }>();

	const currentUserId = useCurrentUserId();
	const currentPlaylist = useAppStore((state) => state.currentPlaylist);
	const publicSongs = useAppStore((state) => state.publicSongs);
	const isLoading = useAppStore((state) => state.isPlaylistLoading);
	const error = useAppStore((state) => state.playlistError);
	const fetchPlaylist = useAppStore((state) => state.fetchPlaylist);
	const clearCurrentPlaylist = useAppStore((state) => state.clearCurrentPlaylist);
	const addActivePublicSongIds = useAppStore((state) => state.addActivePublicSongIds);

	// Fetch and subscribe to sent shares - must be called before any early return
	useShareSubscription();

	// Fetch playlist on mount or when slug changes
	useEffect(() => {
		if (playlist_slug !== undefined && playlist_slug !== "") {
			void Effect.runPromise(fetchPlaylist(playlist_slug));
		}

		return (): void => {
			clearCurrentPlaylist();
		};
	}, [playlist_slug, fetchPlaylist, clearCurrentPlaylist]);

	// Auto-add the playlist owner to the user's library (fire-and-forget)
	useEffect(() => {
		const ownerId = currentPlaylist?.user_id;
		if (
			typeof ownerId === "string" &&
			ownerId !== "" &&
			currentUserId !== undefined &&
			currentUserId !== ownerId
		) {
				void (async (): Promise<void> => {
				try {
					await Effect.runPromise(
						addUserToLibraryEffect({ followed_user_id: ownerId }, () =>
							getTypedState(),
						),
					);
				} catch {
					/* ignore errors */
				}
			})();
		}
		// oxlint-disable-next-line no-empty-function -- no cleanup for fire-and-forget; return fn for React 19 HMR
		return;
	}, [currentPlaylist, currentUserId]);

	// Fetch song details so we can display song names (populates publicSongs)
	useEffect(() => {
		const order = currentPlaylist?.public?.song_order;
		if (Array.isArray(order) && order.length > SONGS_NONE) {
			void Effect.runPromise(addActivePublicSongIds(order));
		}
		// oxlint-disable-next-line no-empty-function -- no cleanup for fetch; return fn for React 19 HMR
		return;
	}, [currentPlaylist, addActivePublicSongIds]);

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

	if (!currentPlaylist?.public) {
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

	const playlistPublic = currentPlaylist.public;
	const songOrder = playlistPublic.song_order ?? [];
	const isOwner = currentUserId !== undefined && currentUserId === currentPlaylist.user_id;

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
						{songOrder.map((songId, index) => (
							<div
								key={songId}
								className="flex items-center gap-4"
							>
								<div className="min-w-0 flex-1">
									<PlaylistSongDisplay
										songId={songId}
										index={index}
										publicSongs={publicSongs}
									/>
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
