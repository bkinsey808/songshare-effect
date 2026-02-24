import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

/**
 * Basic unit tests for the small helper in `decodeUnknownSyncOrThrow.ts`.
 *
 * The function is intentionally a thin wrapper around
 * `Schema.decodeUnknownSync` so most of the work is done by Effect's schema
 * implementation.  Our tests simply exercise the happy path and the error
 * path to guard against accidentally changing the signature or throwing
 * unintended error shapes.
 */

describe("decodeUnknownSyncOrThrow", () => {
	it("returns the decoded value when the schema matches", () => {
		const schema = Schema.String;

		const result = decodeUnknownSyncOrThrow(schema, "hello world");

		expect(result).toBe("hello world");
	});

	it("preserves the inferred type of the schema", () => {
		const schema = Schema.Struct({
			id: Schema.Number,
			name: Schema.String,
		});

		const validId = 42;
		const input = { id: validId, name: "alice" } as unknown;

		const result = decodeUnknownSyncOrThrow(schema, input);

		// TypeScript should know `result` has `id` and `name` properties.
		const { id, name } = result;
		expect(id).toBe(validId);
		expect(name).toBe("alice");
	});

	it("throws when the value does not satisfy the schema", () => {
		const schema = Schema.Number;

		expect(() => decodeUnknownSyncOrThrow(schema, "not a number")).toThrow(/number/);
	});
});
