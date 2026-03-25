import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import runUnwrapped from "./runUnwrapped.test-util";

describe("runUnwrapped", () => {
	it("returns Effect result when Effect succeeds", async () => {
		// Arrange
		const value = { ok: true };

		// Act
		const result = await runUnwrapped(Effect.succeed(value));

		// Assert
		expect(result).toStrictEqual(value);
	});

	it("throws when Effect fails with plain error", async () => {
		// Arrange
		const err = new Error("fail");

		// Act
		const action = runUnwrapped(Effect.fail(err));

		// Assert
		await expect(action).rejects.toThrow("fail");
	});

	it("throws parsed JSON when error message is JSON string", async () => {
		// Arrange
		const payload = { code: "VALIDATION_ERROR", message: "Invalid input" };
		const err = new Error(JSON.stringify(payload));

		// Act
		const action = runUnwrapped(Effect.fail(err));

		// Assert: the parsed fields are copied onto the thrown Error and the
		// human-facing message is available on `message`.
		await expect(action).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
		await expect(action).rejects.toThrow(payload.message);
	});

	it("throws original error when message is not valid JSON", async () => {
		// Arrange
		const err = new Error("plain text");

		// Act
		const action = runUnwrapped(Effect.fail(err));

		// Assert
		await expect(action).rejects.toThrow("plain text");
	});

	it("rethrows plain Error from Effect.fail", async () => {
		// Arrange
		const err = new Error("custom");

		// Act
		const action = runUnwrapped(Effect.fail(err));

		// Assert
		await expect(action).rejects.toThrow("custom");
	});
});
