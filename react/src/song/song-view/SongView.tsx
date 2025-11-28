import { type ReactElement } from "react";
import { useParams } from "react-router-dom";

import { useAppStoreSelector } from "@/react/zustand/useAppStore";
import { isRecord, isString } from "@/shared/utils/typeGuards";

type SongMethods = {
	addActivePublicSongSlugs: (slugs: ReadonlyArray<string>) => Promise<void>;
	getSongBySlug: (
		slug: string,
	) => { song: unknown; songPublic: unknown } | undefined;
};

export default function SongView(): ReactElement {
	const { song_slug: songSlug } = useParams<{ song_slug?: string }>();
	const addActivePublicSongSlugs = useAppStoreSelector(
		(state: Readonly<SongMethods>) => state.addActivePublicSongSlugs,
	);

	if (songSlug !== undefined && songSlug.trim() !== "") {
		void addActivePublicSongSlugs([songSlug]);
	}

	const getSongBySlug = useAppStoreSelector(
		(state: Readonly<SongMethods>) => state.getSongBySlug,
	);

	const songData = songSlug === undefined ? undefined : getSongBySlug(songSlug);

	if (songData === undefined) {
		return <div>Song not found</div>;
	}

	let maybeSlug: string | undefined = undefined;
	const pub = songData.songPublic ?? undefined;
	if (isRecord(pub)) {
		const slugCandidate = pub["song_slug"];
		if (isString(slugCandidate)) {
			maybeSlug = slugCandidate;
		}
	}

	return <div>Song View: {maybeSlug ?? "Unknown"}</div>;
}
