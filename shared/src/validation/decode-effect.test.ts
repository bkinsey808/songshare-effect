import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

import decodeUnknownEffectOrMap from "./decode-effect";

describe("decodeUnknownEffectOrMap", () => {
	it("succeeds when value matches schema", async () => {
		const schema = Schema.Struct({ name: Schema.String });
		const value = { name: "ok" };

		const res = await Effect.runPromise(
			decodeUnknownEffectOrMap(schema, value, () => new Error("map")),
		);
		expect(res).toStrictEqual(value);
	});

	it("maps decode errors using provided mapper", async () => {
		const schema = Schema.Struct({ name: Schema.String });
		const bad = { name: 123 };

		await expect(
			Effect.runPromise(decodeUnknownEffectOrMap(schema, bad, () => new Error("mapped"))),
		).rejects.toThrow(/mapped/);
	});
});
