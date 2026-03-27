import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import runUnwrapped from "./runUnwrapped.test-util";

describe("runUnwrapped", () => {
	const successCases = [{ name: "succeeds", value: { ok: true } }];

	it.each(successCases)(
		"returns Effect result when $name",
		async ({ value }: { value: unknown }) => {
			// Act
			const result = await runUnwrapped(Effect.succeed(value));
			// Assert
			expect(result).toStrictEqual(value);
		},
	);

	const payload = { code: "VALIDATION_ERROR", message: "Invalid input" };

	const matchCases = [
		{
			name: "json error",
			err: new Error(JSON.stringify(payload)),
			match: { code: "VALIDATION_ERROR" },
			message: payload.message,
		},
	];

	it.each(matchCases)(
		"throws and matches for $name",
		async ({ err, match, message }: { err: Error; match: object; message: string }) => {
			// Act
			const action = runUnwrapped(Effect.fail(err));
			// Assert
			await expect(action).rejects.toMatchObject(match);
			await expect(action).rejects.toThrow(message);
		},
	);

	const throwOnlyCases = [
		{ name: "plain error", err: new Error("fail"), message: "fail" },
		{ name: "not json", err: new Error("plain text"), message: "plain text" },
		{ name: "rethrow plain", err: new Error("custom"), message: "custom" },
	];

	it.each(throwOnlyCases)(
		"throws for $name",
		async ({ err, message }: { err: Error; message: string }) => {
			// Act
			const action = runUnwrapped(Effect.fail(err));
			// Assert
			await expect(action).rejects.toThrow(message);
		},
	);
});
