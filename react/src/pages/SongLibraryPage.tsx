import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import SongLibrary from "@/react/song-library/SongLibrary";
import { getStoreApi } from "@/react/zustand/useAppStore";

function SongLibraryPage(): ReactElement {
	const { t } = useTranslation();

	// Initialize library data on mount
	useEffect((): (() => void) | void => {
		const store = getStoreApi();
		if (!store) {
			return undefined;
		}

		const { fetchLibrary, subscribeToLibrary } = store.getState();

		// Fetch initial library data
		if (typeof fetchLibrary === "function") {
			void fetchLibrary();
		}

		// Subscribe to realtime updates - resubscribe when auth state changes
		if (typeof subscribeToLibrary === "function") {
			const unsubscribe = subscribeToLibrary();

			// Cleanup: unsubscribe when component unmounts or auth state changes
			return (): void => {
				if (typeof unsubscribe === "function") {
					unsubscribe();
				}
			};
		}
		return undefined;
	}, []);

	return (
		<div className="mx-auto max-w-6xl px-4 py-6">
			<div className="mb-8 text-center">
				<h1 className="mb-4 text-3xl font-bold text-white">
					{t("pages.songLibrary.title", "Song Library")}
				</h1>
				<p className="text-lg text-gray-300">
					{t("pages.songLibrary.description", "Browse and manage your song collection")}
				</p>
			</div>

			<SongLibrary />
		</div>
	);
}

export default SongLibraryPage;
