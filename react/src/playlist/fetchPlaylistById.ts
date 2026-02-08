import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import guardAsString from "@/shared/type-guards/guardAsString";
import isRecord from "@/shared/type-guards/isRecord";

import type { Playlist, PlaylistEntry } from "./playlist-types";
import type { PlaylistSlice } from "./slice/playlist-slice";

import isPlaylist from "./guards/isPlaylist";
import isPlaylistPublic from "./guards/isPlaylistPublic";
import {
	InvalidPlaylistDataError,
	NoSupabaseClientError,
	PlaylistError,
	PlaylistNotFoundError,
	QueryError,
} from "./playlist-errors";

const ARRAY_EMPTY = 0;

/**
 * Fetch a playlist by its ID and populate the slice with the combined
 * private and public data (includes owner username when available).
 *
 * @param playlistId - The playlist ID to fetch
 * @param get - Zustand slice getter used to access state and mutation helpers
 * @returns Effect that resolves when the playlist is fetched
 */
export default function fetchPlaylistById(
	playlistId: string,
	get: () => PlaylistSlice,
): Effect.Effect<void, PlaylistError> {
	return Effect.gen(function* fetchPlaylistByIdGen($) {
		const { setCurrentPlaylist, setPlaylistLoading, setPlaylistError } = get();

		yield* $(
			Effect.sync(() => {
				console.warn("[fetchPlaylistById] Starting fetch for id:", playlistId);
				setPlaylistLoading(true);
				setPlaylistError(undefined);
			}),
		);

		const userToken = yield* $(
			Effect.tryPromise({
				try: () => getSupabaseAuthToken(),
				catch: (err) => new QueryError("Failed to get Supabase auth token", err),
			}),
		);

		const client = getSupabaseClient(userToken);
		if (!client) {
			return yield* $(Effect.fail(new NoSupabaseClientError()));
		}

		// First, fetch the public playlist data by ID
		const publicQueryRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "playlist_public", {
						cols: "*",
						eq: { col: "playlist_id", val: playlistId },
					}).then((res) => {
						console.warn("[fetchPlaylistById] Public query result:", JSON.stringify(res));
						return res;
					}),
				catch: (err) => new QueryError("Failed to query playlist_public", err),
			}),
		);

		const publicData: unknown[] = Array.isArray(publicQueryRes["data"])
			? publicQueryRes["data"]
			: [];

		if (publicData.length === ARRAY_EMPTY) {
			return yield* $(Effect.fail(new PlaylistNotFoundError(playlistId)));
		}

		const [playlistPublic] = publicData;
		if (!isPlaylistPublic(playlistPublic)) {
			return yield* $(Effect.fail(new InvalidPlaylistDataError()));
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
				catch:
					// Swallow error - user may not have access
					() => ({ data: [] }) as unknown,
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
				catch: (err) => new QueryError("Failed to query user_public", err),
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
				console.warn("[fetchPlaylistById] Setting playlist:", JSON.stringify(playlistEntry));
				setCurrentPlaylist(playlistEntry);
			}),
		);

		console.warn("[fetchPlaylistById] Complete.");
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setPlaylistLoading, setPlaylistError } = get();
				setPlaylistLoading(false);
				const msg = extractErrorMessage(err, "Failed to fetch playlist");
				setPlaylistError(msg);
				console.error("[fetchPlaylistById] Error:", err);
			}),
		),
		Effect.ensuring(
			Effect.sync(() => {
				const { setPlaylistLoading } = get();
				setPlaylistLoading(false);
			}),
		),
		Effect.mapError((err) =>
			err instanceof PlaylistError
				? err
				: new PlaylistError(extractErrorMessage(err, "Failed to fetch playlist")),
		),
	);
}
