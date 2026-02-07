import { renderHook } from "@testing-library/react";
import { Effect } from "effect";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import type { UserLibraryEntry } from "../slice/user-library-types";

import runRemoveUserFromCardEffect from "../user-remove/runRemoveUserFromCardEffect";
import useUserLibraryCard from "./useUserLibraryCard";

vi.mock(
	"../user-remove/runRemoveUserFromCardEffect",
	(): { default: (args: unknown) => unknown } => ({
		default: vi.fn((_args: unknown): unknown => Effect.succeed(undefined)),
	}),
);

vi.mock(
	"@/react/user-library/useUserLibrary",
	(): { default: () => { removeFromUserLibrary: () => void } } => ({
		default: (): { removeFromUserLibrary: () => void } => ({ removeFromUserLibrary: vi.fn() }),
	}),
);

vi.mock(
	"@/react/song-library/useSongLibrary",
	(): { default: () => { removeFromSongLibrary: () => void } } => ({
		default: (): { removeFromSongLibrary: () => void } => ({ removeFromSongLibrary: vi.fn() }),
	}),
);

vi.mock(
	"@/react/playlist-library/usePlaylistLibrary",
	(): { default: () => { removeFromPlaylistLibrary: () => void } } => ({
		default: (): { removeFromPlaylistLibrary: () => void } => ({
			removeFromPlaylistLibrary: vi.fn(),
		}),
	}),
);

describe("useUserLibraryCard", () => {
	const entry: UserLibraryEntry = {
		user_id: "u1",
		followed_user_id: "u1",
		created_at: new Date().toISOString(),
	};

	it("starts with confirming=false and removing=false and toggles correctly", () => {
		const { result } = renderHook(() =>
			useUserLibraryCard({ entry, songsOwnedByUser: [], playlistsOwnedByUser: [] }),
		);

		expect(result.current.isConfirming).toBe(false);
		expect(result.current.isRemoving).toBe(false);

		act(() => {
			result.current.startConfirming();
		});

		expect(result.current.isConfirming).toBe(true);

		act(() => {
			result.current.cancelConfirming();
		});

		expect(result.current.isConfirming).toBe(false);
	});

	it("calls Effect.runPromise when confirming removal", () => {
		const { result } = renderHook(() =>
			useUserLibraryCard({ entry, songsOwnedByUser: [], playlistsOwnedByUser: [] }),
		);

		result.current.handleConfirm();

		expect(runRemoveUserFromCardEffect).toHaveBeenCalledWith(expect.anything());
	});
});
