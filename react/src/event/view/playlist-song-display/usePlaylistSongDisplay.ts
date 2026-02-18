import { useEffect, useState } from "react";

import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import fetchUsername from "@/react/lib/supabase/enrichment/fetchUsername";
import { safeGet } from "@/shared/utils/safe";

/**
 * Hook for managing the state of a single song in a playlist.
 * Handles fetching and caching the owner's username for the song.
 *
 * @param songId - The ID of the song.
 * @param publicSongs - Record of public songs from the app store.
 * @returns Object containing song data, owner username, and derived subtext.
 */
export default function usePlaylistSongDisplay(
	songId: string,
	publicSongs: Record<string, { song_name?: string; user_id?: string; [key: string]: unknown }>,
): {
	song: { song_name?: string; user_id?: string; [key: string]: unknown } | undefined;
	ownerUsername: string | undefined;
	subText: string;
} {
	const song = safeGet(publicSongs, songId);
	const [ownerUsername, setOwnerUsername] = useState<string | undefined>(undefined);

	// Resolve and cache the song owner username when it is available and not yet loaded.
	useEffect(() => {
		async function fetchOwner(): Promise<void> {
			const client = getSupabaseClient();
			const userId = song?.user_id;

			if (client === undefined || userId === undefined || userId === "") {
				return;
			}

			const username = await fetchUsername({
				client,
				userId,
			});
			if (username !== undefined && username !== "") {
				setOwnerUsername(username);
			}
		}

		if (song?.user_id !== undefined && song.user_id !== "" && ownerUsername === undefined) {
			void fetchOwner();
		}
	}, [song?.user_id, ownerUsername]);

	let subText = "";
	if (ownerUsername !== undefined && ownerUsername !== "") {
		subText = `@${ownerUsername}`;
	} else if (song?.user_id !== undefined && song.user_id !== "") {
		subText = "...";
	}

	return {
		song,
		ownerUsername,
		subText,
	};
}
