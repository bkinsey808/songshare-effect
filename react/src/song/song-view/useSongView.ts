import { Schema } from "effect";
import { useParams } from "react-router-dom";

import { useAppStoreSelector } from "@/react/zustand/useAppStore";

import { type SongPublic, songPublicSchema } from "../song-schema";

type SongMethods = {
	addActivePublicSongSlugs: (slugs: readonly string[]) => Promise<void>;
	getSongBySlug: (
		slug: string,
	) => { song: unknown; songPublic: SongPublic | undefined } | undefined;
};

export type UseSongViewResult = {
	isNotFound: boolean;
	songData:
		| { song: unknown; songPublic: SongPublic | undefined }
		| undefined;
	songPublic: SongPublic | undefined;
};

export function useSongView(): UseSongViewResult {
	const { song_slug: songSlug } = useParams<{ song_slug?: string }>();
	const addActivePublicSongSlugs = useAppStoreSelector(
		(state: Readonly<SongMethods>) => state.addActivePublicSongSlugs,
	);
	const getSongBySlug = useAppStoreSelector(
		(state: Readonly<SongMethods>) => state.getSongBySlug,
	);

	if (songSlug !== undefined && songSlug.trim() !== "") {
		void addActivePublicSongSlugs([songSlug]);
	}

	const songData = songSlug === undefined ? undefined : getSongBySlug(songSlug);
	const songPublic: SongPublic | undefined =
		songData === undefined
			? undefined
			: (() => {
					const decoded = Schema.decodeUnknownEither(songPublicSchema)(songData.songPublic);
					return decoded._tag === "Right" ? decoded.right : undefined;
				})();

	return {
		isNotFound: songData === undefined || songPublic === undefined,
		songData,
		songPublic,
	};
}
