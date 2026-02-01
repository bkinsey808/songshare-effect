import { Schema } from "effect";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

import addUserToLibraryClient from "@/react/user-library/addUserClient";
import { useAppStoreSelector } from "@/react/zustand/useAppStore";

import { type SongPublic, songPublicSchema } from "../song-schema";

/**
 * Minimal subset of the app store selectors used by the song view hook.
 *
 * Keeping this shape intentionally small avoids coupling the hook to the
 * entire store API and makes it explicit what the hook depends on.
 */
type SongMethods = {
	addActivePublicSongSlugs: (slugs: readonly string[]) => Promise<void>;
	getSongBySlug: (
		slug: string,
	) => { song: unknown; songPublic: SongPublic | undefined } | undefined;
};

/**
 * Return value from `useSongView`.
 *
 * - `isNotFound`: true when the slug didn't resolve to a song or the public
 *   metadata failed validation (treat as "not found" for the view).
 * - `songData`: raw data returned from the store (may contain unvalidated fields).
 * - `songPublic`: the validated `SongPublic` payload, or `undefined` if validation failed.
 */
export type UseSongViewResult = {
	isNotFound: boolean;
	songData: { song: unknown; songPublic: SongPublic | undefined } | undefined;
	songPublic: SongPublic | undefined;
};

/**
 * Hook that resolves a song based on the current route `song_slug`.
 *
 * Responsibilities:
 * - Normalize the route slug
 * - Register the slug with the app store to activate background fetching/caching
 * - Retrieve the song data from the store and validate the `songPublic` payload
 *
 * The hook treats missing or schema-invalid `songPublic` as "not found" so the
 * caller can render an appropriate UI.
 *
 * @returns isNotFound - true when the slug did not resolve to a song or the
 *   `songPublic` payload failed schema validation
 * @returns songData - the raw store payload (`{ song, songPublic }`) or
 *   `undefined` when the slug is missing or the song was not found
 * @returns songPublic - the validated `SongPublic` payload, or `undefined`
 *   if validation failed
 */
export function useSongView(): UseSongViewResult {
	const { song_slug: rawSongSlug } = useParams<{ song_slug?: string }>();
	// Normalize `song_slug` from route params by trimming whitespace.
	// Treat empty or whitespace-only slugs as missing to avoid spurious lookups.
	const songSlug = rawSongSlug === undefined ? undefined : rawSongSlug.trim();

	const addActivePublicSongSlugs = useAppStoreSelector(
		(state: Readonly<SongMethods>) => state.addActivePublicSongSlugs,
	);
	const getSongBySlug = useAppStoreSelector((state: Readonly<SongMethods>) => state.getSongBySlug);
	const currentUserId = useAppStoreSelector((state) => state.userSessionData?.user?.user_id);

	if (songSlug !== undefined && songSlug !== "") {
		// Register the slug with the app store so background fetching / caching can start.
		// We intentionally fire-and-forget the returned Promise; the store manages
		// any side effects or errors for activation.
		void addActivePublicSongSlugs([songSlug]);
	}

	const songData = songSlug === undefined || songSlug === "" ? undefined : getSongBySlug(songSlug);

	const songPublic: SongPublic | undefined =
		songData === undefined
			? undefined
			: (() => {
					// Validate `songPublic` with the `songPublicSchema`. We use `decodeUnknownEither`
					// to defensively validate data that may have come from an external source or
					// the store; if validation fails, return `undefined` so the UI can handle it.
					const decoded = Schema.decodeUnknownEither(songPublicSchema)(songData.songPublic);
					return decoded._tag === "Right" ? decoded.right : undefined;
				})();

	// Auto-add the song owner to the user's library (fire-and-forget).
	useEffect(() => {
		if (
			songPublic !== undefined &&
			typeof songPublic.user_id === "string" &&
			currentUserId !== songPublic.user_id
		) {
			void (async (): Promise<void> => {
				try {
					await addUserToLibraryClient(songPublic.user_id);
				} catch {
					/* ignore errors for auto-add */
				}
			})();
		}
	}, [songPublic, songPublic?.user_id, currentUserId]);

	// Consider "not found" when there's no song data or the public metadata failed validation.
	return {
		isNotFound: songData === undefined || songPublic === undefined,
		songData,
		songPublic,
	};
}
