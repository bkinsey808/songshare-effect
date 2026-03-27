import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

import decodeUnknownEffectOrMap from "./decodeUnknownEffectOrMap";

describe("decodeUnknownEffectOrMap", () => {
	it("succeeds when value matches schema", async () => {
		// Arrange
		const schema = Schema.Struct({ name: Schema.String });
		const value = { name: "ok" };

		// Act
		const res = await Effect.runPromise(
			decodeUnknownEffectOrMap(schema, value, () => new Error("map")),
		);

		// Assert
		expect(res).toStrictEqual(value);
	});

	it("maps decode errors using provided mapper", async () => {
		// Arrange
		const schema = Schema.Struct({ name: Schema.String });
		const bad = { name: 123 };

		// Act
		const promise = Effect.runPromise(
			decodeUnknownEffectOrMap(schema, bad, () => new Error("mapped")),
		);

		// Assert
		await expect(promise).rejects.toThrow(/mapped/);
	});
});
