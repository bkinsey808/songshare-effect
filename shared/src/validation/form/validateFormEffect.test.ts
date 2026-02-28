import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

import validateFormEffect from "./validateFormEffect";

describe("validateFormEffect", () => {
	it("succeeds when value matches schema", async () => {
		const schema = Schema.Struct({ foo: Schema.String });
		const value = { foo: "ok" };

		const res = await Effect.runPromise(
			validateFormEffect({
				schema,
				data: value,
				i18nMessageKey: Symbol("irrelevant"),
			}),
		);

		expect(res).toStrictEqual(value);
	});

	it("fails with a ValidationError for an invalid field", async () => {
		const schema = Schema.Struct({ foo: Schema.String });
		const bad = { foo: 123 };

		await expect(
			Effect.runPromise(
				validateFormEffect({
					schema,
					data: bad,
					i18nMessageKey: Symbol("irrelevant"),
				}),
			),
		).rejects.toThrow(/"field":"foo"/);
	});
});
