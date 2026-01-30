import type { NavigateFunction } from "react-router-dom";

import { Effect } from "effect";

import type { SavePlaylistRequest } from "@/react/playlist/playlist-types";
import type { SupportedLanguageType } from "@/shared/language/supported-languages";

import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, playlistLibraryPath } from "@/shared/paths";

export type SubmitPlaylistDeps = {
	/** Effect-returning save function from the playlist slice */
	savePlaylist: (request: Readonly<SavePlaylistRequest>) => Effect.Effect<string, Error>;
	/** Navigation function from react-router's useNavigate */
	navigate: NavigateFunction;
	/** Language code used to build language-aware paths */
	lang: SupportedLanguageType;
};

export type SubmitPlaylistParams = {
	playlistName: string;
	playlistSlug: string;
	publicNotes?: string;
	privateNotes?: string;
	songOrder?: string[];
	playlistId?: string;
};

/**
 * Submit the playlist to the API (create or update), navigate to the library on
 * success and return the created/updated playlist id. Errors are logged and
 * undefined is returned on failure.
 *
 * Accepts high-level camelCase params and builds the SavePlaylistRequest
 * internally so callers don't need to know the persistence shape.
 */
export default async function submitPlaylist(
	deps: SubmitPlaylistDeps,
	params: SubmitPlaylistParams,
): Promise<string | undefined> {
	const { savePlaylist, navigate, lang } = deps;

	const request: SavePlaylistRequest = {
		playlist_name: params.playlistName,
		playlist_slug: params.playlistSlug,
		public_notes: params.publicNotes ?? "",
		private_notes: params.privateNotes ?? "",
		song_order: params.songOrder ?? [],
	};

	if (params.playlistId !== undefined) {
		request.playlist_id = params.playlistId;
	}

	try {
		const playlistId = await Effect.runPromise(savePlaylist(request));

		const libraryPath = buildPathWithLang(`/${dashboardPath}/${playlistLibraryPath}`, lang);
		void navigate(libraryPath);
		console.warn("[submitPlaylist] Saved playlist:", playlistId);

		return playlistId;
	} catch (error) {
		console.error("[submitPlaylist] Save failed:", error);
		return undefined;
	}
}
