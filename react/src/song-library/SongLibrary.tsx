import { useTranslation } from "react-i18next";

import Button from "@/react/lib/design-system/Button";
import CreateSongIcon from "@/react/lib/design-system/icons/CreateSongIcon";
import { ZERO } from "@/shared/constants/shared-constants";

import SongLibraryCard from "./card/SongLibraryCard";
import useSongLibrary from "./useSongLibrary";

/**
 * SongLibrary component — renders the current user's song library.
 *
 * This component selects library state from the app store (initialized by
 * `SongLibraryPage`), and renders loading, error, empty, or the song grid.
 * Each entry exposes actions to view the song or remove it from the library.
 *
 * @returns The song library UI
 */
export default function SongLibrary(): ReactElement {
	const { t } = useTranslation();
	const { songEntries, isLoading, error, handleCreateSongClick } = useSongLibrary();

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
				<Button
					variant="primary"
					size="default"
					icon={<CreateSongIcon className="size-5" />}
					onClick={handleCreateSongClick}
					data-testid="song-library-create-song"
					className="mb-4"
				>
					{t("pages.dashboard.createSong", "Create New Song")}
				</Button>
				<div className="text-sm text-gray-400">
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
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<h2 className="text-xl font-semibold text-white">
						{t("songLibrary.libraryTitle", "My Song Library")}
					</h2>
					<span className="text-sm text-gray-400">
						{t("songLibrary.songCount", "{{count}} songs", { count: songEntries.length })}
					</span>
				</div>
				<Button
					variant="outlinePrimary"
					size="compact"
					icon={<CreateSongIcon className="size-5" />}
					onClick={handleCreateSongClick}
					data-testid="song-library-create-song"
				>
					{t("pages.dashboard.createSong", "Create New Song")}
				</Button>
			</div>

			{/* Song Grid */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{songEntries.map((entry) => (
					<SongLibraryCard key={entry.song_id} entry={entry} />
				))}
			</div>
		</div>
	);
}
