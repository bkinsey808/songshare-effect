import { Effect, Schema } from "effect";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

import useAppStore, { getTypedState } from "@/react/app-store/useAppStore";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPublicWebUrl from "@/react/lib/qr-code/buildPublicWebUrl";
import useShareSubscription from "@/react/share/subscribe/useShareSubscription";
import addUserToLibraryEffect from "@/react/user-library/user-add/addUserToLibraryEffect";
import { songViewPath } from "@/shared/paths";

import { type SongPublic, songPublicSchema } from "../song-schema";

/**
 * Minimal subset of the app store selectors used by the song view hook.
 *
 * Keeping this shape intentionally small avoids coupling the hook to the
 * entire store API and makes it explicit what the hook depends on.
 *
 * `publicSongs` and `privateSongs` are included to enable reactive re-renders
 * when song data loads from Supabase. Using a stable `getSongBySlug` function
 * reference alone would not trigger updates when the underlying maps change.
 */
type SongMethods = {
	addActivePublicSongSlugs: (slugs: readonly string[]) => Promise<void>;
	publicSongs: Readonly<Record<string, SongPublic>>;
	privateSongs: Readonly<Record<string, unknown>>;
};

/**
 * Shape returned by the song view hook.
 *
 * `songData` is the raw store payload, while `songPublic` is the validated
 * version used by the view. `isNotFound` treats missing or invalid public data
 * as a not-found state.
 */
export type UseSongViewResult = {
	isNotFound: boolean;
	isSignedIn: boolean | undefined;
	songData: { song: unknown; songPublic: SongPublic | undefined } | undefined;
	songName: string;
	songPublic: SongPublic | undefined;
	qrUrl: string | undefined;
};

/**
 * Resolve the current song from the route slug and derive view state.
 *
 * Normalizes the route slug, registers it for background fetching, validates
 * the public song payload, subscribes to shared data, and derives the name and
 * QR code URL used by the view.
 *
 * @returns isNotFound - `true` when the slug did not resolve or validation failed.
 * @returns isSignedIn - Whether the current user is authenticated.
 * @returns songData - Raw store payload, or `undefined` when nothing matched.
 * @returns songName - Display name with the Untitled fallback.
 * @returns songPublic - Validated public song payload, or `undefined` on failure.
 * @returns qrUrl - Public song URL for the QR code, or `undefined` when absent.
 */
export function useSongView(): UseSongViewResult {
	const { lang, t } = useLocale();
	const { song_slug: rawSongSlug } = useParams<{ song_slug?: string }>();
	// Normalize `song_slug` from route params by trimming whitespace.
	// Treat empty or whitespace-only slugs as missing to avoid spurious lookups.
	const songSlug = rawSongSlug === undefined ? undefined : rawSongSlug.trim();

	const addActivePublicSongSlugs = useAppStore(
		(state: Readonly<SongMethods>) => state.addActivePublicSongSlugs,
	);

	// Subscribe directly to publicSongs so this hook re-renders when song data
	// arrives from Supabase. Using getSongBySlug (a stable function reference)
	// alone would not trigger re-renders when publicSongs changes.
	const songPublicEntry = useAppStore((state: Readonly<SongMethods>) => {
		if (songSlug === undefined || songSlug === "") {
			return undefined;
		}
		return Object.values(state.publicSongs).find((song) => song.song_slug === songSlug);
	});

	const privateSongEntry = useAppStore((state: Readonly<SongMethods>) => {
		if (songPublicEntry === undefined) {
			return undefined;
		}
		return state.privateSongs[songPublicEntry.song_id];
	});

	const currentUserId = useAppStore((state) => state.userSessionData?.user?.user_id);
	const isSignedIn = useAppStore((state) => state.isSignedIn);

	// Fetch and subscribe to sent shares - must be called before any early return
	useShareSubscription();

	if (songSlug !== undefined && songSlug !== "") {
		// Register the slug with the app store so background fetching / caching can start.
		// We intentionally fire-and-forget the returned Promise; the store manages
		// any side effects or errors for activation.
		void addActivePublicSongSlugs([songSlug]);
	}

	const songData =
		songPublicEntry === undefined
			? undefined
			: { song: privateSongEntry, songPublic: songPublicEntry as SongPublic | undefined };

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
					await Effect.runPromise(
						addUserToLibraryEffect({ followed_user_id: songPublic.user_id }, () => getTypedState()),
					);
				} catch {
					/* ignore errors for auto-add */
				}
			})();
		}
	}, [songPublic, songPublic?.user_id, currentUserId]);

	const qrUrl =
		songPublic?.song_slug !== undefined && songPublic.song_slug !== ""
			? buildPublicWebUrl(`/${songViewPath}/${songPublic.song_slug}`, lang)
			: undefined;

	const songName = songPublic?.song_name ?? t("songView.untitled", "Untitled");

	// Consider "not found" when there's no song data or the public metadata failed validation.
	return {
		isNotFound: songData === undefined || songPublic === undefined,
		isSignedIn,
		songData,
		songName,
		songPublic,
		qrUrl,
	};
}
