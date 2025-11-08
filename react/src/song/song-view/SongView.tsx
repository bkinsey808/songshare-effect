import { useParams } from "react-router-dom";

import { useAppStore } from "@/react/zustand/useAppStore";

type SongMethods = {
	addActivePublicSongSlugs: (slugs: string[]) => Promise<void>;
	getSongBySlug: (
		slug: string,
	) => { song: unknown; songPublic: unknown } | undefined;
};

export default function SongView(): ReactElement {
	const { song_slug: songSlug } = useParams<{ song_slug?: string }>();
	const store = useAppStore() as unknown as (
		selector: (state: SongMethods) => unknown,
	) => unknown;

	const addActivePublicSongSlugs = store(
		(state: SongMethods) => state.addActivePublicSongSlugs,
	) as (slugs: string[]) => Promise<void>;

	if (songSlug !== undefined && songSlug.trim() !== "") {
		void addActivePublicSongSlugs([songSlug]);
	}

	const songData =
		songSlug === undefined
			? undefined
			: (store((state: SongMethods) => state.getSongBySlug(songSlug)) as
					| {
							song: unknown;
							songPublic: { song_slug?: string } | undefined;
					  }
					| undefined);

	if (songData === undefined) {
		return <div>Song not found</div>;
	}

	return <div>Song View: {songData.songPublic?.song_slug ?? "Unknown"}</div>;
}
