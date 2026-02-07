import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { LookupUserResponse } from "../lookupUserByUsernameEffect";

import { NetworkError } from "../user-library-errors";
import runAddUserFlow from "./runAddUserFlow";

describe("runAddUserFlow", () => {
	it("successful flow resets form and toggles loading", async () => {
		const setUsername = vi.fn();
		const setIsOpen = vi.fn();
		const setIsLoading = vi.fn();
		const setError = vi.fn();

		function lookup(_username: string): Effect.Effect<LookupUserResponse> {
			return Effect.succeed({ user_id: "user-1", username: "user-1" });
		}

		function addUserToLibrary(_params: {
			readonly followed_user_id: string;
		}): Effect.Effect<void, Error> {
			return Effect.succeed(undefined);
		}

		await Effect.runPromise(
			runAddUserFlow({
				username: "test",
				lookupUserByUsername: lookup,
				addUserToLibrary,
				t: (_key, defaultValue) => defaultValue,
				setUsername,
				setIsOpen,
				setIsLoading,
				setError,
			}),
		);

		expect(setIsLoading).toHaveBeenCalledWith(true);
		expect(setUsername).toHaveBeenCalledWith("");
		expect(setIsOpen).toHaveBeenCalledWith(false);
		expect(setIsLoading).toHaveBeenCalledWith(false);
		expect(setError).not.toHaveBeenCalled();
	});

	it("failed flow sets error and stops loading", async () => {
		const setUsername = vi.fn();
		const setIsOpen = vi.fn();
		const setIsLoading = vi.fn();
		const setError = vi.fn();

		function lookup(_username: string): Effect.Effect<LookupUserResponse, NetworkError> {
			return Effect.fail(new NetworkError("not found"));
		}

		function addUserToLibrary(_params: {
			readonly followed_user_id: string;
		}): Effect.Effect<void, Error> {
			return Effect.succeed(undefined);
		}

		await Effect.runPromise(
			runAddUserFlow({
				username: "notfound",
				lookupUserByUsername: lookup,
				addUserToLibrary,
				t: (_key, defaultValue) => defaultValue,
				setUsername,
				setIsOpen,
				setIsLoading,
				setError,
			}),
		);

		expect(setError).toHaveBeenCalledWith("not found");
		expect(setIsLoading).toHaveBeenCalledWith(false);
	});
});
