import { Effect, type Effect as EffectType } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { UserLibraryEntry } from "../slice/user-library-types";

import runRemoveUserWithContentEffect from "./runRemoveUserWithContentEffect";

describe("runRemoveUserWithContentEffect", () => {
	it("resolves when underlying removal effect succeeds and doesn't log errors", async () => {
		const userId = "u1";
		const followedUserId = "f1";
		const entry: UserLibraryEntry = {
			user_id: userId,
			followed_user_id: followedUserId,
			created_at: "now",
		};

		const removeFromUserLibrary = vi.fn(() => Effect.succeed(undefined));
		const removeSongFromSongLibrary = vi.fn(() => Effect.succeed(undefined));
		const removePlaylistFromLibrary = vi.fn(() => Effect.succeed(undefined));

		const consoleErrorSpy = vi.spyOn(console, "error");

		await Effect.runPromise(
			runRemoveUserWithContentEffect({
				entry,
				songsOwnedByUser: [],
				playlistsOwnedByUser: [],
				removeFromUserLibrary,
				removeSongFromSongLibrary,
				removePlaylistFromLibrary,
			}),
		);

		expect(removeFromUserLibrary).toHaveBeenCalledWith({ followed_user_id: followedUserId });
		expect(consoleErrorSpy).not.toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});

	it("logs and rethrows when underlying effect fails with an Error", async () => {
		const userId = "u2";
		const followedUserId = "f2";
		const errMsg = "boom";
		const entry: UserLibraryEntry = {
			user_id: userId,
			followed_user_id: followedUserId,
			created_at: "now",
		};

		const removeFromUserLibrary = vi.fn(() => Effect.fail(new Error(errMsg)));
		const removeSongFromSongLibrary = vi.fn(() => Effect.succeed(undefined));
		const removePlaylistFromLibrary = vi.fn(() => Effect.succeed(undefined));

		const consoleErrorSpy = vi.spyOn(console, "error");

		const promise = Effect.runPromise(
			runRemoveUserWithContentEffect({
				entry,
				songsOwnedByUser: [],
				playlistsOwnedByUser: [],
				removeFromUserLibrary,
				removeSongFromSongLibrary,
				removePlaylistFromLibrary,
			}),
		);

		await expect(promise).rejects.toThrow(errMsg);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"[runRemoveUserWithContentEffect] Error removing user:",
			errMsg,
			expect.any(String),
		);

		consoleErrorSpy.mockRestore();
	});

	it("wraps non-Error failures into Error and logs message", async () => {
		const userId = "u3";
		const followedUserId = "f3";
		const raw = "raw error";
		const entry: UserLibraryEntry = {
			user_id: userId,
			followed_user_id: followedUserId,
			created_at: "now",
		};

		const removeFromUserLibrary = forceCast<
			(params: { readonly followed_user_id: string }) => EffectType.Effect<void, Error>
		>(vi.fn(() => Effect.fail(raw as unknown)));
		const removeSongFromSongLibrary = vi.fn(() => Effect.succeed(undefined));
		const removePlaylistFromLibrary = vi.fn(() => Effect.succeed(undefined));

		const consoleErrorSpy = vi.spyOn(console, "error");

		const promise = Effect.runPromise(
			runRemoveUserWithContentEffect({
				entry,
				songsOwnedByUser: [],
				playlistsOwnedByUser: [],
				removeFromUserLibrary,
				removeSongFromSongLibrary,
				removePlaylistFromLibrary,
			}),
		);

		await expect(promise).rejects.toThrow(/raw error/);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"[runRemoveUserWithContentEffect] Error removing user:",
			raw,
			expect.any(String),
		);

		consoleErrorSpy.mockRestore();
	});
});
