import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import runUnwrapped from "./runUnwrapped";

describe("runUnwrapped", () => {
	it("returns Effect result when Effect succeeds", async () => {
		const value = { ok: true };
		const result = await runUnwrapped(Effect.succeed(value));
		expect(result).toStrictEqual(value);
	});

	it("throws when Effect fails with plain error", async () => {
		const err = new Error("fail");
		await expect(runUnwrapped(Effect.fail(err))).rejects.toThrow("fail");
	});

	it("throws parsed JSON when error message is JSON string", async () => {
		const payload = { code: "VALIDATION_ERROR", message: "Invalid input" };
		const err = new Error(JSON.stringify(payload));
		await expect(runUnwrapped(Effect.fail(err))).rejects.toStrictEqual(payload);
	});

	it("throws original error when message is not valid JSON", async () => {
		const err = new Error("plain text");
		await expect(runUnwrapped(Effect.fail(err))).rejects.toThrow("plain text");
	});

	it("rethrows plain Error from Effect.fail", async () => {
		const err = new Error("custom");
		await expect(runUnwrapped(Effect.fail(err))).rejects.toThrow("custom");
	});
});
