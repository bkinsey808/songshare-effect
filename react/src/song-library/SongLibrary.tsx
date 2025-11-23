import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { SupportedLanguageType } from "@/shared/language/supported-languages";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import { useAppStore } from "@/react/zustand/useAppStore";

import type { SongLibraryEntry } from "./song-library-schema";

type SongLibraryMethods = {
	libraryEntries: Record<string, SongLibraryEntry>;
	isLibraryLoading: boolean;
	libraryError?: string;
	fetchLibrary: () => Promise<void>;
	subscribeToLibrary: () => (() => void) | undefined;
	removeFromLibrary: (request: Readonly<{ song_id: string }>) => Promise<void>;
};

export default function SongLibrary(): ReactElement {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const currentLang = i18n.language as SupportedLanguageType;

	const store = useAppStore() as unknown as (
		selector: (state: ReadonlyDeep<SongLibraryMethods>) => unknown,
	) => unknown;

	const libraryEntries = store(
		(state: ReadonlyDeep<SongLibraryMethods>) => state.libraryEntries,
	) as Record<string, SongLibraryEntry>;

	const isLoading = store(
		(state: ReadonlyDeep<SongLibraryMethods>) => state.isLibraryLoading,
	) as boolean;

	const error = store(
		(state: ReadonlyDeep<SongLibraryMethods>) => state.libraryError,
	) as string | undefined;

	const fetchLibrary = store(
		(state: ReadonlyDeep<SongLibraryMethods>) => state.fetchLibrary,
	) as () => Promise<void>;

	const subscribeToLibrary = store(
		(state: ReadonlyDeep<SongLibraryMethods>) => state.subscribeToLibrary,
	) as () => (() => void) | undefined;

	const removeFromLibrary = store(
		(state: ReadonlyDeep<SongLibraryMethods>) => state.removeFromLibrary,
	) as (request: Readonly<{ song_id: string }>) => Promise<void>;

	// Initialize library data and subscription
	useEffect(() => {
		// Fetch initial data
		void fetchLibrary();

		// Set up real-time subscription
		const unsubscribe = subscribeToLibrary();

		// Cleanup function
		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}, [fetchLibrary, subscribeToLibrary]);

	const songEntries = Object.values(libraryEntries);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="flex items-center space-x-2 text-gray-400">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
					<span>
						{t("songLibrary.loading", "Loading your song library...")}
					</span>
				</div>
			</div>
		);
	}

	if (error !== undefined && error.length > 0) {
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

	if (songEntries.length === 0) {
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
				<div className="text-sm text-gray-400">
					{t("songLibrary.songCount", "{{count}} songs", {
						count: songEntries.length,
					})}
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
						<h3 className="mb-2 line-clamp-2 font-semibold text-white">
							{entry.song_name}
						</h3>

						{/* Owner Info */}
						<div className="mb-3 flex items-center space-x-2">
							<div className="flex items-center space-x-1 text-sm text-gray-400">
								<span>👤</span>
								<span>
									{entry.owner_username !== undefined &&
									entry.owner_username.length > 0
										? entry.owner_username
										: t("songLibrary.unknownOwner", "Unknown User")}
								</span>
							</div>
						</div>

						{/* Added Date */}
						<div className="mb-4 text-xs text-gray-500">
							{t("songLibrary.addedOn", "Added {{date}}", {
								date: new Date(entry.created_at).toLocaleDateString(),
							})}
						</div>

						{/* Action Buttons */}
						<div className="flex items-center justify-between">
							<button
								className="text-sm text-blue-400 transition-colors hover:text-blue-300"
								onClick={() => {
									if (
										entry.song_slug !== undefined &&
										entry.song_slug.length > 0
									) {
										void navigate(`/${currentLang}/songs/${entry.song_slug}`);
									}
								}}
								disabled={
									entry.song_slug === undefined || entry.song_slug.length === 0
								}
							>
								{t("songLibrary.viewSong", "View Song")}
							</button>
							<button
								className="text-sm text-red-400 transition-colors hover:text-red-300"
								onClick={() => {
									void removeFromLibrary({ song_id: entry.song_id });
								}}
							>
								{t("songLibrary.removeSong", "Remove")}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
