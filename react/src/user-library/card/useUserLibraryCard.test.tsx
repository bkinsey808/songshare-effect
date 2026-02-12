import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeUserLibraryEntry from "@/react/user-library/test-utils/makeUserLibraryEntry.mock";

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
	const entry: UserLibraryEntry = makeUserLibraryEntry({ user_id: "u1", followed_user_id: "u1" });

	it("starts with confirming=false and removing=false and toggles correctly", async () => {
		const { result } = renderHook(() =>
			useUserLibraryCard({ entry, songsOwnedByUser: [], playlistsOwnedByUser: [] }),
		);

		expect(result.current.isConfirming).toBe(false);
		expect(result.current.isRemoving).toBe(false);

		result.current.startConfirming();

		await waitFor(() => {
			expect(result.current.isConfirming).toBe(true);
		});

		result.current.cancelConfirming();

		await waitFor(() => {
			expect(result.current.isConfirming).toBe(false);
		});
	});

	it("calls Effect.runPromise when confirming removal", () => {
		const { result } = renderHook(() =>
			useUserLibraryCard({ entry, songsOwnedByUser: [], playlistsOwnedByUser: [] }),
		);

		result.current.handleConfirm();

		expect(runRemoveUserFromCardEffect).toHaveBeenCalledWith(expect.anything());
	});
});
