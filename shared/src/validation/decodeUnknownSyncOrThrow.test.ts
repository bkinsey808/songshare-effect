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
		// Arrange
		const schema = Schema.String;

		// Act
		const result = decodeUnknownSyncOrThrow(schema, "hello world");

		// Assert
		expect(result).toBe("hello world");
	});

	it("preserves the inferred type of the schema", () => {
		// Arrange
		const schema = Schema.Struct({
			id: Schema.Number,
			name: Schema.String,
		});

		const validId = 42;
		const input = { id: validId, name: "alice" } as unknown;

		// Act
		const result = decodeUnknownSyncOrThrow(schema, input);

		// Assert
		// TypeScript should know `result` has `id` and `name` properties.
		const { id, name } = result;
		expect(id).toBe(validId);
		expect(name).toBe("alice");
	});

	it("throws when the value does not satisfy the schema", () => {
		// Arrange
		const schema = Schema.Number;

		// Act
		let thrown: unknown = undefined;
		try {
			decodeUnknownSyncOrThrow(schema, "not a number");
		} catch (error) {
			thrown = error;
		}

		// Assert
		expect(thrown).toBeDefined();
		expect(String(thrown)).toMatch(/number/);
	});
});
