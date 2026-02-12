import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeUserLibraryEntry from "@/react/user-library/test-utils/makeUserLibraryEntry.mock";

import type { UserLibraryEntry } from "../slice/user-library-types";

import runRemoveUserFromCardEffect from "./runRemoveUserFromCardEffect";
import runRemoveUserWithContentEffect from "./runRemoveUserWithContentEffect";

vi.mock("./runRemoveUserWithContentEffect");
const mockedRunWithContent = vi.mocked(runRemoveUserWithContentEffect);

describe("runRemoveUserFromCardEffect", () => {
	it("sets removing flag, runs removal, and clears flags on success", async () => {
		vi.resetAllMocks();

		const userId = "u1";
		const followedUserId = "f1";
		const entry: UserLibraryEntry = makeUserLibraryEntry({
			user_id: userId,
			followed_user_id: followedUserId,
			created_at: "now",
		});

		const setIsConfirming = vi.fn();
		const setIsRemoving = vi.fn();

		// mock underlying effect to succeed
		mockedRunWithContent.mockReturnValue(Effect.succeed(undefined));

		await Effect.runPromise(
			runRemoveUserFromCardEffect({
				entry,
				songsOwnedByUser: [],
				playlistsOwnedByUser: [],
				removeFromUserLibrary: vi.fn(() => Effect.succeed(undefined)),
				removeSongFromSongLibrary: vi.fn(() => Effect.succeed(undefined)),
				removePlaylistFromLibrary: vi.fn(() => Effect.succeed(undefined)),
				setIsConfirming,
				setIsRemoving,
			}),
		);

		expect(setIsRemoving).toHaveBeenCalledWith(true);
		expect(setIsConfirming).toHaveBeenCalledWith(false);
		expect(setIsRemoving).toHaveBeenCalledWith(false);
		expect(mockedRunWithContent).toHaveBeenCalledWith(expect.objectContaining({ entry }));
	});

	it("clears removing flag and logs error when underlying removal fails", async () => {
		vi.resetAllMocks();

		const userId = "u2";
		const followedUserId = "f2";
		const entry: UserLibraryEntry = makeUserLibraryEntry({
			user_id: userId,
			followed_user_id: followedUserId,
			created_at: "now",
		});

		const setIsConfirming = vi.fn();
		const setIsRemoving = vi.fn();

		const err = new Error("boom");
		mockedRunWithContent.mockReturnValue(Effect.fail(err));

		const consoleErrorSpy = vi.spyOn(console, "error");

		const promise = Effect.runPromise(
			runRemoveUserFromCardEffect({
				entry,
				songsOwnedByUser: [],
				playlistsOwnedByUser: [],
				removeFromUserLibrary: vi.fn(() => Effect.succeed(undefined)),
				removeSongFromSongLibrary: vi.fn(() => Effect.succeed(undefined)),
				removePlaylistFromLibrary: vi.fn(() => Effect.succeed(undefined)),
				setIsConfirming,
				setIsRemoving,
			}),
		);

		await expect(promise).rejects.toThrow(/boom/);

		expect(setIsRemoving).toHaveBeenCalledWith(true);
		expect(setIsRemoving).toHaveBeenCalledWith(false);
		expect(setIsConfirming).not.toHaveBeenCalledWith(false);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"[runRemoveUserFromCardEffect] Error removing user:",
			expect.stringMatching(/boom/),
			expect.any(String),
		);

		consoleErrorSpy.mockRestore();
	});
});
