import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";
// stub out debug logging so tests aren't noisy and we can inspect calls

import makeResponse from "@/react/lib/test-utils/makeResponse";
import { clientDebug } from "@/react/lib/utils/clientLogger";

import createApiResponseHandlerEffect from "./createApiResponseHandlerEffect";

// stub out debug logging so tests aren't noisy and we can inspect calls
vi.mock("@/react/lib/utils/clientLogger", (): { clientDebug: typeof clientDebug } => ({
	clientDebug: vi.fn(),
}));

/**
 * Minimal `Response` builder used across the handler tests.
 * We don't need the full networking behavior because the underlying
 * `createApiResponseEffect` already has its own tests; here we only
 * care that the handler reacts correctly to the *result* of that
 * effect.  Constructing real `Response` objects is simple and keeps
 * the tests aligned with the public API.
 */

describe("createApiResponseHandlerEffect", () => {
	it("returns true for ok responses and doesn't call any callbacks", async () => {
		const res = makeResponse({
			ok: true,
			status: 200,
			json: async () => {
				await Promise.resolve();
				return {};
			},
		});

		const setValidationErrors = vi.fn();
		const setSubmitError = vi.fn();

		await expect(
			Effect.runPromise(
				createApiResponseHandlerEffect({
					response: res,
					setValidationErrors,
					setSubmitError,
				}),
			),
		).resolves.toBe(true);

		expect(setValidationErrors).not.toHaveBeenCalled();
		expect(setSubmitError).not.toHaveBeenCalled();
		expect(clientDebug).toHaveBeenCalledWith("🎯 API response success");
	});

	it("handles field errors by invoking setValidationErrors and returns false", async () => {
		const res = makeResponse({
			ok: false,
			status: 400,
			json: async () => {
				await Promise.resolve();
				return { field: "name", error: "required" };
			},
		});

		const setValidationErrors = vi.fn();
		const setSubmitError = vi.fn();

		await expect(
			Effect.runPromise(
				createApiResponseHandlerEffect({
					response: res,
					setValidationErrors,
					setSubmitError,
				}),
			),
		).resolves.toBe(false);

		expect(setValidationErrors).toHaveBeenCalledWith([{ field: "name", message: "required" }]);
		expect(setSubmitError).not.toHaveBeenCalled();
		expect(clientDebug).toHaveBeenCalledWith("💥 API response failure action:", {
			type: "setFieldError",
			field: "name",
			message: "required",
		});
		expect(clientDebug).toHaveBeenCalledWith("📝 Setting field error:", "name", "required");
	});

	it("handles general errors by invoking setSubmitError and returns false", async () => {
		const res = makeResponse({
			ok: false,
			status: 500,
			json: async () => {
				await Promise.resolve();
				return { error: "server went down" };
			},
		});

		const setValidationErrors = vi.fn();
		const setSubmitError = vi.fn();

		await expect(
			Effect.runPromise(
				createApiResponseHandlerEffect({
					response: res,
					setValidationErrors,
					setSubmitError,
				}),
			),
		).resolves.toBe(false);

		expect(setValidationErrors).not.toHaveBeenCalled();
		expect(setSubmitError).toHaveBeenCalledWith("server went down");
		expect(clientDebug).toHaveBeenCalledWith("💥 API response failure action:", {
			type: "setGeneralError",
			message: "server went down",
		});
		expect(clientDebug).toHaveBeenCalledWith("🚨 Setting submit error:", "server went down");
	});

	it("uses defaultErrorMessage when core message is generic and default provided", async () => {
		const res = makeResponse({
			ok: false,
			status: 400,
			json: async () => {
				await Promise.resolve();
				return { error: "An error occurred" };
			},
		});

		const setValidationErrors = vi.fn();
		const setSubmitError = vi.fn();

		await expect(
			Effect.runPromise(
				createApiResponseHandlerEffect({
					response: res,
					setValidationErrors,
					setSubmitError,
					defaultErrorMessage: "custom fallback",
				}),
			),
		).resolves.toBe(false);

		expect(setSubmitError).toHaveBeenCalledWith("custom fallback");
	});

	it("does not override non-generic error with defaultErrorMessage", async () => {
		const res = makeResponse({
			ok: false,
			status: 418,
			json: async () => {
				await Promise.resolve();
				return { error: "specific issue" };
			},
		});

		const setValidationErrors = vi.fn();
		const setSubmitError = vi.fn();

		await expect(
			Effect.runPromise(
				createApiResponseHandlerEffect({
					response: res,
					setValidationErrors,
					setSubmitError,
					defaultErrorMessage: "should not be used",
				}),
			),
		).resolves.toBe(false);

		expect(setSubmitError).toHaveBeenCalledWith("specific issue");
	});
});
