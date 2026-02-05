import { Effect } from "effect";

import type { Get, Set } from "@/react/zustand/slice-utils";

import type { PlaylistError, PlaylistErrors } from "../playlist-errors";
import type { SavePlaylistRequest } from "../playlist-types";
import type { PlaylistSlice } from "../slice/playlist-slice";

/**
 * Test helper factory for `createUpdateLocalSongOrder` tests.
 *
 * Provides a typed `set` and `get` pair and a mutable `setCalls` array
 * capturing all `set` calls for assertions.
 *
 * @returns An object with `set`, `get` and `setCalls` for use in tests
 */
export default function makeSetGetForCreateUpdateLocalSongOrder(): {
	set: Set<PlaylistSlice>;
	get: Get<PlaylistSlice>;
	setCalls: Parameters<Set<PlaylistSlice>> extends [infer First, ...unknown[]] ? First[] : never;
} {
	type SetParam =
		Parameters<Set<PlaylistSlice>> extends [infer First, ...unknown[]] ? First : never;

	const setCalls: SetParam[] = [];

	let internalState: PlaylistSlice = (function makeInitial(): PlaylistSlice {
		return {
			currentPlaylist: undefined,
			isPlaylistLoading: false,
			playlistError: undefined,
			isPlaylistSaving: false,

			fetchPlaylist: (_slug: string): Effect.Effect<void, PlaylistErrors> =>
				Effect.sync(() => undefined),
			fetchPlaylistById: (_id: string): Effect.Effect<void, PlaylistErrors> =>
				Effect.sync(() => undefined),
			savePlaylist: (_req: SavePlaylistRequest): Effect.Effect<string, PlaylistError> =>
				Effect.sync(() => ""),

			clearCurrentPlaylist: (): void => undefined,
			updateLocalSongOrder: (_songOrder: readonly string[]): void => undefined,
			addSongToLocalPlaylist: (_songId: string): void => undefined,
			removeSongFromLocalPlaylist: (_songId: string): void => undefined,
			setCurrentPlaylist: (_playlist?: unknown): void => undefined,
			setPlaylistLoading: (_loading: boolean): void => undefined,
			setPlaylistError: (_error?: string): void => undefined,
			setPlaylistSaving: (_saving: boolean): void => undefined,
			isSongInPlaylist: (_songId: string): boolean => false,
		};
	})();

	function set(partial: SetParam, _replace?: boolean): void {
		setCalls.push(partial);

		if (typeof partial === "function") {
			// Apply updater to internal state and update it
			const updater = partial as (state: PlaylistSlice) => PlaylistSlice | void;
			const result = updater(internalState);
			if (result) {
				internalState = result;
			}
		} else {
			internalState = { ...internalState, ...(partial as object) } as PlaylistSlice;
		}
	}

	function get(): PlaylistSlice {
		return internalState;
	}

	return { set: set as Set<PlaylistSlice>, get: get as Get<PlaylistSlice>, setCalls };
}
