import { clientWarn } from "@/react/utils/clientLogger";
import { apiSongLibraryAddPath } from "@/shared/paths";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import { isRecord, isString } from "@/shared/utils/typeGuards";

import type { SongLibrarySlice } from "./song-library-slice";
import type { AddSongToSongLibraryRequest, SongLibraryEntry } from "./song-library-types";

/**
 * Extract error message from JSON response
 * @param data - Data from response.json()
 * @returns Error message string or undefined
 */
function extractErrorMessage(data: unknown): string | undefined {
	if (!isRecord(data)) {
		return undefined;
	}
	const { error } = data;
	if (typeof error === "string") {
		return error;
	}
	return undefined;
}

/**
 * Extract and validate song library response
 * @param data - Data from response.json()
 * @returns Validated response object
 */
function extractSongLibraryResponse(data: unknown): {
	user_id?: unknown;
	song_id?: unknown;
	song_owner_id?: unknown;
	created_at?: unknown;
	owner_username?: unknown;
} {
	if (!isRecord(data)) {
		throw new Error("Invalid response from server");
	}
	return data as {
		user_id?: unknown;
		song_id?: unknown;
		song_owner_id?: unknown;
		created_at?: unknown;
		owner_username?: unknown;
	};
}

/**
 * Add a song to the current user's library (via server endpoint).
 *
 * Calls /api/song-library/add server endpoint which:
 * - Validates the request
 * - Performs the insert using service key (bypasses RLS for trusted operation)
 * - Enforces all security through server-side validation
 *
 * On success, the local store is updated via `addSongLibraryEntry`.
 *
 * @param request - Request containing `song_id` and `song_owner_id`
 * @param get - Zustand slice getter for accessing state and mutation helpers
 * @returns void (resolves when the operation completes)
 * @throws Error when the server endpoint call fails or returns an error
 */
export default async function addSongToSongLibrary(
	request: Readonly<AddSongToSongLibraryRequest>,
	get: () => SongLibrarySlice,
): Promise<void> {
	const { setSongLibraryError, isInSongLibrary, addSongLibraryEntry } = get();

	// Clear any previous errors
	setSongLibraryError(undefined);

	// Validate incoming request shape to avoid unsafe any → string assignments
	if (!isRecord(request) || !isString(request.song_id) || !isString(request.song_owner_id)) {
		throw new Error("Invalid request to addSongToSongLibrary: missing song_id or song_owner_id");
	}

	// Check if already in library
	if (isInSongLibrary(request.song_id)) {
		clientWarn("[addSongToSongLibrary] Song already in song library:", request.song_id);
		return;
	}

	try {
		// Call server endpoint to add song to library
		const response = await fetch(apiSongLibraryAddPath, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				song_id: request.song_id,
				song_owner_id: request.song_owner_id,
			}),
		});

		if (!response.ok) {
			const errorData = extractErrorMessage(await response.json());
			throw new Error(errorData ?? `Server returned ${response.status}: ${response.statusText}`);
		}

		const data = extractSongLibraryResponse(await response.json());

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { user_id, song_id, song_owner_id, created_at, owner_username } = data as {
			user_id?: unknown;
			song_id?: unknown;
			song_owner_id?: unknown;
			created_at?: unknown;
			owner_username?: unknown;
		};

		if (!isString(user_id) || !isString(song_id) || !isString(song_owner_id)) {
			throw new Error("Invalid response from server: missing required fields");
		}

		const libraryEntry: SongLibraryEntry = {
			user_id,
			song_id,
			song_owner_id,
			created_at: isString(created_at) ? created_at : new Date().toISOString(),
		};

		// Add optional owner username if present
		if (isString(owner_username)) {
			libraryEntry.owner_username = owner_username;
		}

		addSongLibraryEntry(libraryEntry);
	} catch (error) {
		const errorMsg = getErrorMessage(error);
		clientWarn("[addSongToSongLibrary] Failed to add song to library:", errorMsg);
		setSongLibraryError(errorMsg);
		throw error;
	}
}
