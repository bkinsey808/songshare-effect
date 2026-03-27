import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

import validateFormEffect from "./validateFormEffect";

describe("validateFormEffect", () => {
	it("succeeds when value matches schema", async () => {
		// Arrange
		const schema = Schema.Struct({ foo: Schema.String });
		const value = { foo: "ok" };

		// Act
		const res = await Effect.runPromise(
			validateFormEffect({
				schema,
				data: value,
				i18nMessageKey: Symbol("irrelevant"),
			}),
		);

		// Assert
		expect(res).toStrictEqual(value);
	});

	it("fails with a ValidationError for an invalid field", async () => {
		// Arrange
		const schema = Schema.Struct({ foo: Schema.String });
		const bad = { foo: 123 };

		// Act
		const promise = Effect.runPromise(
			validateFormEffect({
				schema,
				data: bad,
				i18nMessageKey: Symbol("irrelevant"),
			}),
		);

		// Assert
		await expect(promise).rejects.toThrow(/"field":"foo"/);
	});
});
