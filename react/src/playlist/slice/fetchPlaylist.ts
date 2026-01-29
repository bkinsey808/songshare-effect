import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import callSelect from "@/react/supabase/client/safe-query/callSelect";
import guardAsString from "@/shared/type-guards/guardAsString";
import isRecord from "@/shared/type-guards/isRecord";
import getErrorMessage from "@/shared/utils/getErrorMessage";

import type { PlaylistSlice } from "./playlist-slice";
import type { Playlist, PlaylistEntry, PlaylistPublic } from "./playlist-types";

/**
 * Validates that a value is a valid Playlist record.
 * @param value - The value to check.
 * @returns True if the value is a valid Playlist.
 */
function isPlaylist(value: unknown): value is Playlist {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value["playlist_id"] === "string" &&
		typeof value["user_id"] === "string" &&
		typeof value["private_notes"] === "string"
	);
}

/**
 * Validates that a value is a valid PlaylistPublic record.
 * @param value - The value to check.
 * @returns True if the value is a valid PlaylistPublic.
 */
function isPlaylistPublic(value: unknown): value is PlaylistPublic {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value["playlist_id"] === "string" &&
		typeof value["user_id"] === "string" &&
		typeof value["playlist_name"] === "string" &&
		typeof value["playlist_slug"] === "string" &&
		Array.isArray(value["song_order"])
	);
}

/**
 * Fetch a playlist by its slug and populate the slice with the combined
 * private and public data (includes owner username when available).
 *
 * @param playlistSlug - The playlist slug to fetch
 * @param get - Zustand slice getter used to access state and mutation helpers
 * @returns Effect that resolves when the playlist is fetched
 */
export default function fetchPlaylist(
	playlistSlug: string,
	get: () => PlaylistSlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* fetchPlaylistGen($) {
		const { setCurrentPlaylist, setPlaylistLoading, setPlaylistError } = get();

		yield* $(
			Effect.sync(() => {
				console.warn("[fetchPlaylist] Starting fetch for slug:", playlistSlug);
				setPlaylistLoading(true);
				setPlaylistError(undefined);
			}),
		);

		const ARRAY_EMPTY = 0;

		const userToken = yield* $(
			Effect.tryPromise({
				try: () => getSupabaseAuthToken(),
				catch: (err) => new Error(String(err)),
			}),
		);

		const client = getSupabaseClient(userToken);
		if (!client) {
			return yield* $(Effect.fail(new Error("No Supabase client available")));
		}

		// First, fetch the public playlist data by slug
		const publicQueryRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "playlist_public", {
						cols: "*",
						eq: { col: "playlist_slug", val: playlistSlug },
					}).then((res) => {
						console.warn("[fetchPlaylist] Public query result:", JSON.stringify(res));
						return res;
					}),
				catch: (err) => new Error(String(err)),
			}),
		);

		const publicData: unknown[] = Array.isArray(publicQueryRes["data"])
			? publicQueryRes["data"]
			: [];

		if (publicData.length === ARRAY_EMPTY) {
			return yield* $(Effect.fail(new Error(`Playlist not found: ${playlistSlug}`)));
		}

		const [playlistPublic] = publicData;
		if (!isPlaylistPublic(playlistPublic)) {
			return yield* $(Effect.fail(new Error("Invalid playlist_public data")));
		}

		// Try to fetch private data (will only succeed if user is the owner)
		let playlistPrivate: Playlist | undefined = undefined;
		const privateQueryRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "playlist", {
						cols: "*",
						eq: { col: "playlist_id", val: playlistPublic.playlist_id },
					}).then((res) => res),
				catch: () => ({ data: [] }) as unknown, // Swallow error - user may not have access
			}),
		);

		if (isRecord(privateQueryRes)) {
			const privateData: unknown[] = Array.isArray(privateQueryRes["data"])
				? privateQueryRes["data"]
				: [];
			const [maybePrivate] = privateData;
			if (maybePrivate !== undefined && isPlaylist(maybePrivate)) {
				playlistPrivate = maybePrivate;
			}
		}

		// Fetch owner username
		let ownerUsername: string | undefined = undefined;
		const ownerQueryRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "user_public", {
						cols: "user_id, username",
						eq: { col: "user_id", val: playlistPublic.user_id },
					}).then((res) => res),
				catch: (err) => new Error(String(err)),
			}),
		);

		if (isRecord(ownerQueryRes)) {
			const ownerData: unknown[] = Array.isArray(ownerQueryRes["data"])
				? ownerQueryRes["data"]
				: [];
			const [ownerRecord] = ownerData;
			if (ownerRecord !== undefined && isRecord(ownerRecord)) {
				ownerUsername = guardAsString(ownerRecord["username"]);
			}
		}

		// Construct the playlist entry
		const playlistEntry: PlaylistEntry = {
			playlist_id: playlistPublic.playlist_id,
			user_id: playlistPublic.user_id,
			private_notes: playlistPrivate?.private_notes ?? "",
			created_at: playlistPrivate?.created_at ?? playlistPublic.created_at ?? "",
			updated_at: playlistPrivate?.updated_at ?? playlistPublic.updated_at ?? "",
			public: playlistPublic,
			...(ownerUsername === undefined ? {} : { owner_username: ownerUsername }),
		};

		yield* $(
			Effect.sync(() => {
				console.warn("[fetchPlaylist] Setting playlist:", JSON.stringify(playlistEntry));
				setCurrentPlaylist(playlistEntry);
			}),
		);

		console.warn("[fetchPlaylist] Complete.");
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setPlaylistLoading, setPlaylistError } = get();
				setPlaylistLoading(false);
				const msg = getErrorMessage(err, "Failed to fetch playlist");
				setPlaylistError(msg);
				console.error("[fetchPlaylist] Error:", err);
			}),
		),
		Effect.ensuring(
			Effect.sync(() => {
				const { setPlaylistLoading } = get();
				setPlaylistLoading(false);
			}),
		),
		Effect.mapError((err) =>
			err instanceof Error ? err : new Error(getErrorMessage(err, "Failed to fetch playlist")),
		),
		// The pipeline above normalizes unknown errors to Error.
		// The double-cast is necessary to satisfy the Effect typing in this generator-based workflow.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	) as unknown as Effect.Effect<void, Error>;
}
