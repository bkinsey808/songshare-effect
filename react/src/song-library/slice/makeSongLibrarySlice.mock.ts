import { Effect } from "effect";
import { vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { SongLibrarySlice } from "./song-library-slice";
import type { SongLibraryEntry } from "./song-library-types";

/**
 * Returns a getter for a minimal, test-friendly `SongLibrarySlice`.
 * The returned getter exposes stateful behavior for `setSongLibraryEntries`,
 * `addSongLibraryEntry`, and `removeSongLibraryEntry` so tests can assert
 * against `slice.songLibraryEntries` after actions run.
 */
export default function makeSongLibrarySlice(
	initialEntries: Record<string, SongLibraryEntry> = {},
): () => SongLibrarySlice {
	const state = {
		songLibraryEntries: initialEntries,
		isSongLibraryLoading: false,
		songLibraryError: undefined as string | undefined,
	};

	const setSongLibraryEntries = vi.fn((entries: Record<string, SongLibraryEntry>) => {
		state.songLibraryEntries = entries;
	});

	const setSongLibraryLoading = vi.fn((loading: boolean) => {
		state.isSongLibraryLoading = loading;
	});

	const setSongLibraryError = vi.fn((err?: string) => {
		state.songLibraryError = err;
	});

	const addSongLibraryEntry = vi.fn((entry: SongLibraryEntry) => {
		state.songLibraryEntries = forceCast<Record<string, SongLibraryEntry>>({
			...state.songLibraryEntries,
			[entry.song_id]: entry,
		});
	});

	const removeSongLibraryEntry = vi.fn((id: string) => {
		const { [id]: _removed, ...rest } = state.songLibraryEntries;
		state.songLibraryEntries = forceCast<Record<string, SongLibraryEntry>>(rest);
	});

	const stub: unknown = {
		get songLibraryEntries(): Record<string, SongLibraryEntry> {
			return state.songLibraryEntries;
		},
		get isSongLibraryLoading(): boolean {
			return state.isSongLibraryLoading;
		},
		get songLibraryError(): string | undefined {
			return state.songLibraryError;
		},

		addSongToSongLibrary: (_req: unknown): unknown => ({}),
		removeSongFromSongLibrary: (_req: unknown): unknown => ({}),
		isInSongLibrary: (id: string): boolean => id in state.songLibraryEntries,
		getSongLibrarySongIds: (): string[] => Object.keys(state.songLibraryEntries),
		fetchSongLibrary: (): unknown => Effect.sync(() => undefined),
		subscribeToSongLibrary: (): unknown => Effect.sync(() => (): void => undefined),
		subscribeToSongPublic: (): unknown => Effect.sync(() => (): void => undefined),
		setSongLibraryEntries,
		setSongLibraryLoading,
		setSongLibraryError,
		addSongLibraryEntry,
		removeSongLibraryEntry,
	};

	return () => forceCast<SongLibrarySlice>(stub);
}
