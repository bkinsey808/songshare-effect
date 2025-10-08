import { Context, Effect, Layer } from "effect";

import { NotFoundError } from "./errors";
import type { Song } from "./schemas";

// Song service interface
export type SongService = {
	readonly getAll: Effect.Effect<Song[]>;
	readonly getById: (id: string) => Effect.Effect<Song, NotFoundError>;
	readonly create: (song: Omit<Song, "id">) => Effect.Effect<Song>;
	readonly update: (
		id: string,
		updates: Partial<Song>,
	) => Effect.Effect<Song, NotFoundError>;
	readonly delete: (id: string) => Effect.Effect<void, NotFoundError>;
};

// Tag for dependency injection
export const SongService = Context.GenericTag<SongService>("SongService");

// In-memory storage
const songs: Song[] = [];

// In-memory implementation (replace with actual database later)
const createInMemorySongService = (): SongService => ({
	getAll: Effect.succeed(songs),

	getById: (id: string): Effect.Effect<Song, NotFoundError> =>
		Effect.gen(function* () {
			const song = songs.find((sng) => sng.id === id);
			if (!song) {
				return yield* Effect.fail(
					new NotFoundError({
						message: `Song with id ${id} not found`,
						resource: "Song",
						id,
					}),
				);
			}
			return song;
		}),

	create: (songData: Omit<Song, "id">): Effect.Effect<Song> =>
		Effect.sync(() => {
			const id =
				// eslint-disable-next-line sonarjs/pseudo-random
				Math.random().toString(36).substring(2) + Date.now().toString(36);
			const newSong: Song = {
				id,
				...songData,
			};
			songs.push(newSong);
			return newSong;
		}),

	update: (
		id: string,
		updates: Partial<Song>,
	): Effect.Effect<Song, NotFoundError> =>
		Effect.gen(function* () {
			const songIndex = songs.findIndex((sng) => sng.id === id);
			if (songIndex === -1) {
				return yield* Effect.fail(
					new NotFoundError({
						message: `Song with id ${id} not found`,
						resource: "Song",
						id,
					}),
				);
			}
			// Safe array access - songIndex is guaranteed to exist
			// Non-null assertion since we verified the index exists
			// eslint-disable-next-line security/detect-object-injection
			const existingSong = songs[songIndex]!;
			const updatedSong: Song = {
				...existingSong,
				...updates,
				// Ensure required fields are preserved from existing song
				id: existingSong.id,
				title: updates.title ?? existingSong.title,
				artist: updates.artist ?? existingSong.artist,
				duration: updates.duration ?? existingSong.duration,
				fileUrl: updates.fileUrl ?? existingSong.fileUrl,
				uploadedAt: updates.uploadedAt ?? existingSong.uploadedAt,
				userId: updates.userId ?? existingSong.userId,
			};
			// eslint-disable-next-line security/detect-object-injection
			songs[songIndex] = updatedSong;
			return updatedSong;
		}),

	delete: (id: string): Effect.Effect<void, NotFoundError> =>
		Effect.gen(function* () {
			const songIndex = songs.findIndex((sng) => sng.id === id);
			if (songIndex === -1) {
				return yield* Effect.fail(
					new NotFoundError({
						message: `Song with id ${id} not found`,
						resource: "Song",
						id,
					}),
				);
			}
			songs.splice(songIndex, 1);
		}),
});

// Layer for providing the song service
export const InMemorySongServiceLive = Layer.succeed(
	SongService,
	createInMemorySongService(),
);
