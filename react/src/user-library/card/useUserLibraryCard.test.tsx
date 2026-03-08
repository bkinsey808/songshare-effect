import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import usePlaylistLibrary from "@/react/playlist-library/usePlaylistLibrary";
import useSongLibrary from "@/react/song-library/useSongLibrary";
import makeUserLibraryEntry from "@/react/user-library/test-utils/makeUserLibraryEntry.mock";
import useUserLibrary from "@/react/user-library/useUserLibrary";

import type { UserLibraryEntry } from "../slice/user-library-types";
import runRemoveUserFromCardEffect from "../user-remove/runRemoveUserFromCardEffect";
import useUserLibraryCard from "./useUserLibraryCard";

vi.mock("../user-remove/runRemoveUserFromCardEffect");
vi.mock("@/react/user-library/useUserLibrary");
vi.mock("@/react/song-library/useSongLibrary");
vi.mock("@/react/playlist-library/usePlaylistLibrary");

function installHookMocks(): void {
	vi.mocked(runRemoveUserFromCardEffect).mockImplementation(() => Effect.succeed(undefined));
	vi.mocked(useUserLibrary).mockReturnValue(
		forceCast<ReturnType<typeof useUserLibrary>>({ removeFromUserLibrary: vi.fn() }),
	);
	vi.mocked(useSongLibrary).mockReturnValue(
		forceCast<ReturnType<typeof useSongLibrary>>({ removeFromSongLibrary: vi.fn() }),
	);
	vi.mocked(usePlaylistLibrary).mockReturnValue(
		forceCast<ReturnType<typeof usePlaylistLibrary>>({ removeFromPlaylistLibrary: vi.fn() }),
	);
}

describe("useUserLibraryCard", () => {
	const entry: UserLibraryEntry = makeUserLibraryEntry({ user_id: "u1", followed_user_id: "u1" });

	it("starts with confirming=false and removing=false and toggles correctly", async () => {
		installHookMocks();
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
		installHookMocks();
		const { result } = renderHook(() =>
			useUserLibraryCard({ entry, songsOwnedByUser: [], playlistsOwnedByUser: [] }),
		);

		result.current.handleConfirm();

		expect(runRemoveUserFromCardEffect).toHaveBeenCalledWith(expect.anything());
	});
});
