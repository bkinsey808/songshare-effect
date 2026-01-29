import { Effect } from "effect";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import useLocale from "@/react/language/locale/useLocale";
import { useAppStore } from "@/react/zustand/useAppStore";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, playlistEditPath, songViewPath } from "@/shared/paths";
import formatAppDate from "@/shared/utils/formatAppDate";

/**
 * Page component for viewing a playlist by slug.
 * @returns The playlist view page.
 */
const SONGS_NONE = 0;
const INDEX_STEP = 1;

export default function PlaylistPage(): ReactElement {
	const { t } = useTranslation();
	const { lang } = useLocale();
	const { playlist_slug } = useParams<{ playlist_slug: string }>();

	const currentPlaylist = useAppStore((state) => state.currentPlaylist);
	const isLoading = useAppStore((state) => state.isPlaylistLoading);
	const error = useAppStore((state) => state.playlistError);
	const fetchPlaylist = useAppStore((state) => state.fetchPlaylist);
	const clearCurrentPlaylist = useAppStore((state) => state.clearCurrentPlaylist);
	const currentUserId = useAppStore((state) => state.userSessionData?.user.user_id);

	// Fetch playlist on mount or when slug changes
	useEffect(() => {
		if (playlist_slug !== undefined && playlist_slug !== "") {
			void Effect.runPromise(fetchPlaylist(playlist_slug));
		}

		return (): void => {
			clearCurrentPlaylist();
		};
	}, [playlist_slug, fetchPlaylist, clearCurrentPlaylist]);

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
	const isOwner = currentUserId !== undefined && currentUserId === currentPlaylist.user_id;
	const songOrder = playlistPublic.song_order ?? [];

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
								className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4"
							>
								<div className="flex items-center space-x-4">
									<span className="w-8 text-center text-gray-500">{index + INDEX_STEP}</span>
									<div>
										{/* NOTE: Fetch song details and display song name (future work) */}
										<p className="text-white">Song ID: {songId}</p>
									</div>
								</div>
								<Link
									to={buildPathWithLang(`/${songViewPath}/${songId}`, lang)}
									className="text-sm text-blue-400 hover:text-blue-300"
								>
									{t("playlist.viewSong", "View")}
								</Link>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
