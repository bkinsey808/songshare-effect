import { type Set } from "@/react/app-store/app-store-types";
import { type ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import { type SongSubscribeSlice } from "../song-slice/song-slice";

/**
 * Remove a deleted public song from both the `publicSongs` map and the
 * `activePublicSongIds` list in a single, immutable state update.
 *
 * The implementation uses object rest destructuring to exclude the deleted key
 * and returns the remaining map. `void _deleted` intentionally silences the
 * unused variable lint while keeping the destructuring readable.
 *
 * @param deletedPublicSongId - id of the public song that was deleted
 * @param set - Zustand `set` function for the SongSubscribeSlice
 * @returns void
 */
export default function handleSongDeletion(
	deletedPublicSongId: string,
	set: Set<SongSubscribeSlice>,
): void {
	set((state: ReadonlyDeep<SongSubscribeSlice>) => {
		const { [deletedPublicSongId]: _deleted, ...rest } = state.publicSongs;
		// Keep the destructured variable to clearly show we intentionally removed it
		void _deleted;
		return {
			publicSongs: rest,
			activePublicSongIds: state.activePublicSongIds.filter(
				(songId) => songId !== deletedPublicSongId,
			),
		};
	});
}
