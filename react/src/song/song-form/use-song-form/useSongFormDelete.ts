import { Effect } from "effect";
import { useNavigate } from "react-router-dom";

import deleteSongEffect from "./submit/deleteSongRequest";

type UseSongFormDeleteParams = {
	readonly songId: string | undefined;
	readonly removeActivePrivateSongIds: (songIds: readonly string[]) => void;
	readonly removeActivePublicSongIds: (songIds: readonly string[]) => void;
	readonly removeSongsFromCache: (songIds: readonly string[]) => void;
	readonly removeSongLibraryEntry: (songId: string) => void;
};

type UseSongFormDeleteReturn = {
	readonly handleDelete: () => Promise<void>;
};

const NAVIGATE_BACK = -1;

/**
 * Hook that handles song deletion, API call, and store cleanup.
 *
 * @param params - Configuration object with songId and store methods
 * @returns Object with handleDelete function
 */
export default function useSongFormDelete(
	params: UseSongFormDeleteParams,
): UseSongFormDeleteReturn {
	const {
		songId,
		removeActivePrivateSongIds,
		removeActivePublicSongIds,
		removeSongsFromCache,
		removeSongLibraryEntry,
	} = params;
	const navigate = useNavigate();

	/**
	 * Delete the song and clean up store caches and UI state.
	 *
	 * @returns Promise that resolves after deletion
	 */
	async function handleDelete(): Promise<void> {
		const id = songId?.trim();
		if (id === undefined || id === "") {
			return;
		}
		try {
			await Effect.runPromise(deleteSongEffect(id));
			removeActivePrivateSongIds([id]);
			removeActivePublicSongIds([id]);
			removeSongsFromCache([id]);
			removeSongLibraryEntry(id);
			void navigate(NAVIGATE_BACK);
		} catch (error) {
			console.error(
				"[useSongFormDelete] Delete failed:",
				error instanceof Error ? error.message : String(error),
			);
		}
	}

	return {
		handleDelete,
	};
}
