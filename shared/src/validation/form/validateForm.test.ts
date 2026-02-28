/* Test for validateForm — keep lint rules enabled; avoid disables */

import { Schema } from "effect";
import { describe, expect, it, vi } from "vitest";

import { type ValidationError } from "../validate-types";

// We'll import `validateForm` dynamically inside tests so individual cases
// can choose whether to mock `validateFormEffect` (avoids affecting tests
// that expect the real implementation).
// We'll import `validateForm` dynamically inside tests so individual cases
// can choose whether to mock `validateFormEffect` (avoids affecting tests
// that expect the real implementation).

// helper type used by some tests
type SimpleShape = { foo: string };

describe("validateForm", () => {
	it("returns success with typed data when schema passes", async () => {
		vi.resetModules();
		const { default: validateForm } = await import("./validateForm");

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
		vi.resetModules();
		const { default: validateForm } = await import("./validateForm");

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
		vi.resetModules();
		const fakeErrors: ValidationError[] = [{ field: "x", message: "msg" }];

		class FiberFailureImpl extends Error {}
		vi.doMock(import("./validateFormEffect"), () => ({
			__esModule: true,
			default: vi.fn(() => {
				throw new FiberFailureImpl(JSON.stringify(fakeErrors));
			}),
		}));

		const { default: validateForm } = await import("./validateForm");

		const res = validateForm<string>({
			schema: Schema.String,
			data: "whatever",
			i18nMessageKey: Symbol("irrelevant"),
		});

		expect(res).toStrictEqual({ success: false, errors: fakeErrors });
	});

	it("extracts errors from a plain Error whose message is JSON", async () => {
		vi.resetModules();
		const fakeErrors: ValidationError[] = [{ field: "y", message: "m2" }];
		vi.doMock(import("./validateFormEffect"), () => ({
			__esModule: true,
			default: vi.fn(() => {
				throw new Error(JSON.stringify(fakeErrors));
			}),
		}));

		const { default: validateForm } = await import("./validateForm");

		const res = validateForm<string>({
			schema: Schema.String,
			data: "anything",
			i18nMessageKey: Symbol("irrelevant"),
		});

		expect(res).toStrictEqual({ success: false, errors: fakeErrors });
	});

	it("falls back to a generic form error when the thrown value is unrecognised", async () => {
		vi.resetModules();
		vi.doMock(import("./validateFormEffect"), () => ({
			__esModule: true,
			default: vi.fn(() => {
				throw new Error("nope");
			}),
		}));

		const { default: validateForm } = await import("./validateForm");

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
		vi.resetModules();
		const fakeErrors: ValidationError[] = [{ field: "z", message: "m3" }];
		const thrown = new Error("thrown") as Error & { cause?: unknown };
		thrown.cause = fakeErrors;

		vi.doMock(import("./validateFormEffect"), () => ({
			__esModule: true,
			default: vi.fn(() => {
				throw thrown;
			}),
		}));

		const { default: validateForm } = await import("./validateForm");

		const res = validateForm<string>({
			schema: Schema.String,
			data: "whatever",
			i18nMessageKey: Symbol("irrelevant"),
		});

		expect(res).toStrictEqual({ success: false, errors: fakeErrors });
	});
});
