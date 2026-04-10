import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiSongsDeletePath } from "@/shared/paths";

/**
 * Sends a delete request for the given song.
 *
 * @param songId - The ID of the song to delete
 * @returns An Effect that resolves on success or fails with an Error
 */
export default function deleteSongEffect(songId: string): Effect.Effect<void, Error> {
	return Effect.gen(function* deleteSongGen($) {
		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiSongsDeletePath, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ song_id: songId }),
						credentials: "include",
					}),
				catch: (error) => new Error(extractErrorMessage(error, "Failed to delete song")),
			}),
		);

		if (response.ok) {
			return;
		}

		const raw: unknown = yield* $(
			Effect.tryPromise({
				try: () => response.json(),
				catch: () => new Error(response.statusText),
			}),
		);

		const message = extractErrorMessage(raw, response.statusText);
		return yield* $(Effect.fail(new Error(message)));
	});
}
