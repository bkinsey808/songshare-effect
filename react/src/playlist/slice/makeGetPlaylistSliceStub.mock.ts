import { vi } from "vitest";

import type { PlaylistSlice } from "@/react/playlist/slice/playlist-slice";

/**
 * Create a minimal `PlaylistSlice` getter stub for tests.
 *
 * The returned function always returns the same stub instance so callers can
 * inspect spies after the test runs. The stub exposes commonly-used methods
 * such as `setCurrentPlaylist`, `setPlaylistLoading` and `setPlaylistError`.
 *
 * @returns A function that returns a `PlaylistSlice`-shaped stub with spy methods.
 */
export default function makeGetStub(): () => PlaylistSlice {
	const stub = {
		currentPlaylist: undefined,
		isPlaylistLoading: false,
		playlistError: undefined,
		isPlaylistSaving: false,
		fetchPlaylist: (_slug: string): unknown => ({}) as unknown,
		savePlaylist: (_req: unknown): unknown => ({}) as unknown,
		clearCurrentPlaylist: (): void => undefined,
		updateLocalSongOrder: (_songOrder: readonly string[]): void => undefined,
		addSongToLocalPlaylist: (_songId: string): void => undefined,
		removeSongFromLocalPlaylist: (_songId: string): void => undefined,
		setCurrentPlaylist: vi.fn(),
		setPlaylistLoading: vi.fn(),
		setPlaylistError: vi.fn(),
		setPlaylistSaving: vi.fn(),
		isSongInPlaylist: (_songId: string): boolean => false,
	};
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	return () => stub as unknown as PlaylistSlice;
}
