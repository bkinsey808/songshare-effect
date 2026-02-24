/* oxlint-disable @typescript-eslint/no-explicit-any,
   @typescript-eslint/no-unsafe-type-assertion,
   @typescript-eslint/no-unsafe-assignment,
   @typescript-eslint/only-throw-error,
   no-throw-literal,
   import/exports-last,
   jest/no-export
*/

import { Schema } from "effect";
import { describe, expect, it, vi } from "vitest";

import { type ValidationError } from "./validate-types";
import validateForm from "./validateForm";
import * as validateFormEffectModule from "./validateFormEffect"; // oxlint-disable-line import/no-namespace

// helper type used by some tests
// oxlint-disable-next-line @typescript-eslint/consistent-type-definitions
type SimpleShape = { foo: string };

describe("validateForm", () => {
	it("returns success with typed data when schema passes", () => {
		const schema = Schema.Struct({ foo: Schema.String });
		const good: SimpleShape = { foo: "hello" };

		const result = validateForm<SimpleShape>({
			schema,
			data: good,
			i18nMessageKey: Symbol("irrelevant"),
		});

		expect(result).toStrictEqual({ success: true, data: good });
	});

	it("returns a field-specific error when value is invalid", () => {
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

	it("handles FiberFailureImpl errors by parsing the message as JSON", () => {
		const fakeErrors: ValidationError[] = [{ field: "x", message: "msg" }];

		class FiberFailureImpl extends Error {}

		vi.spyOn(validateFormEffectModule, "default").mockImplementation(() => {
			throw new FiberFailureImpl(JSON.stringify(fakeErrors));
		});

		const res = validateForm<unknown>({
			schema: Schema.String as any,
			data: "whatever",
			i18nMessageKey: Symbol("irrelevant"),
		});

		expect(res).toStrictEqual({ success: false, errors: fakeErrors });
	});

	it("extracts errors from a plain Error whose message is JSON", () => {
		const fakeErrors: ValidationError[] = [{ field: "y", message: "m2" }];

		vi.spyOn(validateFormEffectModule, "default").mockImplementation(() => {
			throw new Error(JSON.stringify(fakeErrors));
		});

		const res = validateForm<unknown>({
			schema: Schema.String as any,
			data: "anything",
			i18nMessageKey: Symbol("irrelevant"),
		});

		expect(res).toStrictEqual({ success: false, errors: fakeErrors });
	});

	it("falls back to a generic form error when the thrown value is unrecognised", () => {
		vi.spyOn(validateFormEffectModule, "default").mockImplementation(() => {
			throw new Error("nope");
		});

		const res = validateForm<unknown>({
			schema: Schema.String as any,
			data: "whatever",
			i18nMessageKey: Symbol("irrelevant"),
		});

		expect(res).toStrictEqual({
			success: false,
			errors: [{ field: "form", message: "Validation failed" }],
		});
	});

	it("can pull errors out of an arbitrary object with a cause property", () => {
		const fakeErrors: ValidationError[] = [{ field: "z", message: "m3" }];
		const thrown = { cause: fakeErrors };

		vi.spyOn(validateFormEffectModule, "default").mockImplementation(() => {
			throw thrown as any;
		});

		const res = validateForm<unknown>({
			schema: Schema.String as any,
			data: "whatever",
			i18nMessageKey: Symbol("irrelevant"),
		});

		expect(res).toStrictEqual({ success: false, errors: fakeErrors });
	});
});
