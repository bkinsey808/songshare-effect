/* Test for validateForm — keep lint rules enabled; avoid disables */

import { Schema } from "effect";
import { describe, expect, it, vi } from "vitest";

import type validateFormType from "./validateForm";
import type validateFormEffectType from "./validateFormEffect";

import { type ValidationError } from "../validate-types";

// helper type used by some tests
type SimpleShape = { foo: string };

async function init(
	mockValidateFormEffect?: typeof validateFormEffectType,
): Promise<typeof validateFormType> {
	vi.resetModules();

	if (mockValidateFormEffect !== undefined) {
		vi.doMock(import("./validateFormEffect"), () => ({
			__esModule: true,
			default: mockValidateFormEffect,
		}));
	}

	const { default: validateForm } = await import("./validateForm");
	return validateForm;
}

describe("validateForm", () => {
	it("returns success with typed data when schema passes", async () => {
		const validateForm = await init();

		const schema = Schema.Struct({ foo: Schema.String });
		const good: SimpleShape = { foo: "hello" };

		const result = validateForm<SimpleShape>({
			schema,
			data: good,
			i18nMessageKey: Symbol("irrelevant"),
		});

		expect(result).toStrictEqual({ success: true, data: good });
	});

	it("returns a field-specific error when value is invalid", async () => {
		const validateForm = await init();

		const schema = Schema.Struct({ foo: Schema.String });
		const bad = { foo: 123 };

		const result = validateForm<SimpleShape>({
			schema,
			data: bad,
			i18nMessageKey: Symbol("irrelevant"),
		});

		expect(result).toMatchObject({
			success: false,
			errors: [{ field: "foo" }],
		});
	});

	it("handles FiberFailureImpl errors by parsing the message as JSON", async () => {
		const fakeErrors: ValidationError[] = [{ field: "x", message: "msg" }];

		class FiberFailureImpl extends Error {}
		const validateForm = await init(
			vi.fn(() => {
				throw new FiberFailureImpl(JSON.stringify(fakeErrors));
			}),
		);

		const res = validateForm<string>({
			schema: Schema.String,
			data: "whatever",
			i18nMessageKey: Symbol("irrelevant"),
		});

		expect(res).toStrictEqual({ success: false, errors: fakeErrors });
	});

	it("extracts errors from a plain Error whose message is JSON", async () => {
		const fakeErrors: ValidationError[] = [{ field: "y", message: "m2" }];
		const validateForm = await init(
			vi.fn(() => {
				throw new Error(JSON.stringify(fakeErrors));
			}),
		);

		const res = validateForm<string>({
			schema: Schema.String,
			data: "anything",
			i18nMessageKey: Symbol("irrelevant"),
		});

		expect(res).toStrictEqual({ success: false, errors: fakeErrors });
	});

	it("falls back to a generic form error when the thrown value is unrecognised", async () => {
		const validateForm = await init(
			vi.fn(() => {
				throw new Error("nope");
			}),
		);

		const res = validateForm<string>({
			schema: Schema.String,
			data: "whatever",
			i18nMessageKey: Symbol("irrelevant"),
		});

		expect(res).toStrictEqual({
			success: false,
			errors: [{ field: "form", message: "Validation failed" }],
		});
	});

	it("can pull errors out of an arbitrary object with a cause property", async () => {
		const fakeErrors: ValidationError[] = [{ field: "z", message: "m3" }];
		const thrown = new Error("thrown") as Error & { cause?: unknown };
		thrown.cause = fakeErrors;

		const validateForm = await init(
			vi.fn(() => {
				throw thrown;
			}),
		);

		const res = validateForm<string>({
			schema: Schema.String,
			data: "whatever",
			i18nMessageKey: Symbol("irrelevant"),
		});

		expect(res).toStrictEqual({ success: false, errors: fakeErrors });
	});
});
