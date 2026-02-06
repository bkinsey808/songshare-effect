import type { TFunction } from "i18next";

import { Link } from "react-router-dom";

import type { SupportedLanguageType } from "@/shared/language/supported-languages";

import useAppStore from "@/react/app-store/useAppStore";
import { ZERO } from "@/shared/constants/shared-constants";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, songEditPath, songViewPath } from "@/shared/paths";
import formatAppDate from "@/shared/utils/formatAppDate";

import useSongLibrary from "./useSongLibrary";

export type SongLibraryProps = {
	lang: SupportedLanguageType;
	/** Translation function `t` from i18next */
	t: TFunction;
	navigate: (to: string) => void;
};

/**
 * SongLibrary component — renders the current user's song library.
 *
 * This component selects library state from the app store (initialized by
 * `SongLibraryPage`), and renders loading, error, empty, or the song grid.
 * Each entry exposes actions to view the song or remove it from the library.
 *
 * @returns The song library UI
 */
export default function SongLibrary({ lang, t, navigate }: SongLibraryProps): ReactElement {
	const { songEntries, isLoading, error, removeFromSongLibrary } = useSongLibrary();
	const currentUserId = useAppStore((state) => state.userSessionData?.user.user_id);

	console.warn("[SongLibrary] Render state:", {
		entriesCount: songEntries.length,
		isLoading,
		error,
		firstEntryId: songEntries[ZERO]?.song_id ?? "none",
		firstEntryName: songEntries[ZERO]?.song_name ?? "none",
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="flex items-center space-x-2 text-gray-400">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
					<span>{t("songLibrary.loading", "Loading your song library...")}</span>
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
							{t("songLibrary.errorTitle", "Error Loading Library")}
						</h3>
						<p className="text-red-400">{error}</p>
					</div>
				</div>
			</div>
		);
	}

	if (songEntries.length === ZERO) {
		return (
			<div className="py-12 text-center">
				<div className="mb-4 text-6xl">📚</div>
				<h2 className="mb-2 text-xl font-semibold text-white">
					{t("songLibrary.emptyTitle", "Your song library is empty")}
				</h2>
				<p className="mb-6 text-gray-400">
					{t(
						"songLibrary.emptyDescription",
						"Start building your collection by adding songs you love!",
					)}
				</p>
				<div className="text-sm text-gray-500">
					{t(
						"songLibrary.emptyHint",
						"Browse songs and click the bookmark icon to add them to your library",
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
					{t("songLibrary.libraryTitle", "My Song Library")}
				</h2>
				<div className="flex items-center space-x-4 text-sm text-gray-400">
					<div>{t("songLibrary.songCount", "{{count}} songs", { count: songEntries.length })}</div>
					{import.meta.env.DEV ? (
						<button
							type="button"
							className="text-xs rounded border border-yellow-500 bg-yellow-700/10 px-2 py-1 text-yellow-300 hover:bg-yellow-700/20"
							onClick={() => {
								void (async (): Promise<void> => {
									try {
										await Promise.all(
											songEntries.map((entry) =>
												fetch("/api/dev/song-public/update", {
													method: "POST",
													headers: { "Content-Type": "application/json" },
													body: JSON.stringify({
														song_id: entry.song_id,
														song_name: `${entry.song_name} (dev ${new Date().toISOString()})`,
													}),
												}),
											),
										);
									} catch (error) {
										console.error("[dev] updateSongPublic failed:", error);
									}
								})();
							}}
						>
							Dev Update All
						</button>
					) : undefined}
				</div>
			</div>

			{/* Song Grid */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{songEntries.map((entry) => (
					<div
						key={entry.song_id}
						className="group hover:bg-gray-750 rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-gray-600"
					>
						{/* Song Title */}
						<h3 className="mb-2 line-clamp-2 font-semibold text-white">{entry.song_name}</h3>

						{/* Owner Info */}
						<div className="mb-3 flex items-center space-x-2">
							<div className="flex items-center space-x-1 text-sm text-gray-400">
								<span>👤</span>
								<span>
									{typeof entry.owner_username === "string" && entry.owner_username !== ""
										? entry.owner_username
										: t("songLibrary.unknownOwner", "Unknown User")}
								</span>
							</div>
						</div>

						{/* Added Date */}
						<div className="mb-4 text-xs text-gray-400">
							{t("songLibrary.addedOn", "Added {{date}}", {
								date: formatAppDate(entry.created_at),
							})}
						</div>

						{/* Action Buttons */}
						<div className="flex items-center justify-between gap-2">
							{entry.song_slug !== undefined && entry.song_slug.trim() !== "" ? (
								<Link
									to={buildPathWithLang(`/${songViewPath}/${entry.song_slug}`, lang)}
									className="text-sm text-blue-400 transition-colors hover:text-blue-300"
								>
									{t("songLibrary.viewSong", "View Song")}
								</Link>
							) : (
								<span className="cursor-not-allowed text-sm text-gray-500">
									{t("songLibrary.viewSong", "View Song")}
								</span>
							)}
							{currentUserId !== undefined && currentUserId === entry.song_owner_id ? (
								<button
									type="button"
									className="text-sm text-green-400 transition-colors hover:text-green-300"
									onClick={() => {
										navigate(`/${lang}/${dashboardPath}/${songEditPath}/${entry.song_id}`);
									}}
								>
									{t("songLibrary.editSong", "Edit")}
								</button>
							) : undefined}
							{currentUserId !== undefined && currentUserId !== entry.song_owner_id ? (
								<button
									type="button"
									className="text-sm text-red-400 transition-colors hover:text-red-300"
									onClick={() => {
										void removeFromSongLibrary({ song_id: entry.song_id });
									}}
								>
									{t("songLibrary.removeSong", "Remove")}
								</button>
							) : undefined}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
