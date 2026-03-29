import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { NetworkError } from "@/react/user-library/user-library-errors";
import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";

import createAddUserEffect from "./createAddUserEffect";

const TRANSLATION_KEY = "addUserForm.emptyUsername";
const DEFAULT_MESSAGE = "Please enter a username";
const USERNAME = "testuser";

/**
 * Mock translation function factory for tests.
 * @param defaultMessage - The message to return for the specific translation key.
 * @returns A mock translation function.
 */
function makeT(defaultMessage: string): (key: string, fallback: string) => string {
	return vi.fn((key: string, fallback: string) => {
		if (key === TRANSLATION_KEY) {
			return defaultMessage;
		}
		return fallback;
	});
}

describe("createAddUserEffect", () => {
	it("fails when username is empty after trim", async () => {
		const lookup = vi.fn(() => Effect.succeed({ user_id: TEST_USER_ID, username: USERNAME }));
		const addUser = vi.fn(() => Effect.void);
		const t = makeT(DEFAULT_MESSAGE);

		const result = await Effect.runPromise(
			createAddUserEffect({
				username: "   ",
				lookupUserByUsername: lookup,
				addUserToLibrary: addUser,
				t,
			}).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.message).toBe(DEFAULT_MESSAGE);
		expect(lookup).not.toHaveBeenCalled();
		expect(addUser).not.toHaveBeenCalled();
	});

	it("fails when lookup fails", async () => {
		const lookupError = new NetworkError("User not found");
		const lookup = vi.fn(() => Effect.fail(lookupError));
		const addUser = vi.fn(() => Effect.void);
		const t = makeT(DEFAULT_MESSAGE);

		await expect(
			Effect.runPromise(
				createAddUserEffect({
					username: USERNAME,
					lookupUserByUsername: lookup,
					addUserToLibrary: addUser,
					t,
				}),
			),
		).rejects.toThrow("User not found");

		expect(lookup).toHaveBeenCalledWith(USERNAME);
		expect(addUser).not.toHaveBeenCalled();
	});

	it("fails when addUserToLibrary fails", async () => {
		const addError = new Error("Add failed");
		const lookup = vi.fn(() => Effect.succeed({ user_id: TEST_USER_ID, username: USERNAME }));
		const addUser = vi.fn(() => Effect.fail(addError));
		const t = makeT(DEFAULT_MESSAGE);

		await expect(
			Effect.runPromise(
				createAddUserEffect({
					username: USERNAME,
					lookupUserByUsername: lookup,
					addUserToLibrary: addUser,
					t,
				}),
			),
		).rejects.toThrow("Add failed");

		expect(lookup).toHaveBeenCalledWith(USERNAME);
		expect(addUser).toHaveBeenCalledWith({ followed_user_id: TEST_USER_ID });
	});

	it("succeeds when lookup and add succeed", async () => {
		const lookup = vi.fn(() => Effect.succeed({ user_id: TEST_USER_ID, username: USERNAME }));
		const addUser = vi.fn(() => Effect.void);
		const t = makeT(DEFAULT_MESSAGE);

		await Effect.runPromise(
			createAddUserEffect({
				username: `  ${USERNAME}  `,
				lookupUserByUsername: lookup,
				addUserToLibrary: addUser,
				t,
			}),
		);

		expect(lookup).toHaveBeenCalledWith(USERNAME);
		expect(addUser).toHaveBeenCalledWith({ followed_user_id: TEST_USER_ID });
	});
});
