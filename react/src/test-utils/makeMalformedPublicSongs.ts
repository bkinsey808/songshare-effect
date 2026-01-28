import type { SongPublic } from "@/react/song/song-schema";

export default function makeMalformedPublicSongs(): Record<string, SongPublic> {
	const publicSongs: Record<string, unknown> = {
		valid: {
			song_id: "valid",
			song_slug: "valid",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		},
		badUndefined: undefined,
		badType: { song_slug: 123 },
	};

	/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-assignment -- test-only: pass malformed fixture shape */
	return publicSongs as unknown as Record<string, SongPublic>;
}
