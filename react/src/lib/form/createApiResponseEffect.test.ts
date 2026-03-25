import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { clientDebug } from "@/react/lib/utils/clientLogger";
import runUnwrapped from "@/shared/test-utils/runUnwrapped.test-util";

import createApiResponseEffect from "./createApiResponseEffect";

// stub out debug logging so the real implementation isn't called and
// we can easily assert on the calls.  Pattern borrowed from similar tests.
vi.mock("@/react/lib/utils/clientLogger");

/**
 * Helper for constructing a minimal `Response` object for the tests.
 *
 * The implementation uses a double-cast to keep the test focused on
 * behaviour rather than creating a full `Response`.  Disable the unsafe
 * assertion lint rule locally rather than at module scope.
 */
function makeResponse(
	opts: Partial<Pick<Response, "ok" | "status">> & {
		json: () => Promise<unknown>;
	},
): Response {
	// use a real Response instance so we satisfy the type checker without
	// unsafe casts.  JSDOM (used by Vitest) provides the constructor.
	const DEFAULT_STATUS = 0;
	const status = opts.status ?? DEFAULT_STATUS;
	const res = new Response(undefined, { status });
	// override `json` via descriptor to keep TypeScript happy without an
	// unsafe assertion.  The runtime method will simply be replaced.
	Object.defineProperty(res, "json", { value: opts.json });
	return res;
}

/**
 * Run an effect and, if it fails, parse the serialized failure payload out of
 * the FiberFailure error message so callers can assert on the original value.
 */

describe("createApiResponseEffect", () => {
	// each test will reset mocks manually to avoid global hooks

	it("resolves to success for ok responses", async () => {
		// Arrange
		vi.resetAllMocks();
		const res = makeResponse({
			ok: true,
			status: 200,
			json: async () => {
				await Promise.resolve();
				return {};
			},
		});

		await expect(Effect.runPromise(createApiResponseEffect(res))).resolves.toStrictEqual({
			type: "success",
		});

		expect(clientDebug).toHaveBeenCalledWith("✅ Response is OK");
	});

	it("fails with setFieldError when payload has a nonempty field and error", async () => {
		// Arrange
		vi.resetAllMocks();
		const res = makeResponse({
			ok: false,
			status: 400,
			json: async () => {
				await Promise.resolve();
				return { field: "email", error: "invalid" };
			},
		});

		// Act
		const action = runUnwrapped(createApiResponseEffect(res));

		// Assert
		await expect(action).rejects.toMatchObject({
			type: "setFieldError",
			field: "email",
		} as const);
		await expect(action).rejects.toThrow("invalid");

		expect(clientDebug).toHaveBeenCalledWith("🎯 Field-specific error detected");
	});

	it("fails with setGeneralError when there is only a general error string", async () => {
		// Arrange
		vi.resetAllMocks();
		const res = makeResponse({
			ok: false,
			status: 500,
			json: async () => {
				await Promise.resolve();
				return { error: "oops" };
			},
		});

		// Act
		const action = runUnwrapped(createApiResponseEffect(res));

		// Assert
		await expect(action).rejects.toMatchObject({ type: "setGeneralError" } as const);
		await expect(action).rejects.toThrow("oops");

		expect(clientDebug).toHaveBeenCalledWith("🚨 General error detected");
	});

	it("converts missing/undefined error into fallback message", async () => {
		// Arrange
		vi.resetAllMocks();
		const res = makeResponse({
			ok: false,
			status: 418,
			json: async () => {
				await Promise.resolve();
				return {};
			},
		});

		// Act
		const action = runUnwrapped(createApiResponseEffect(res));

		// Assert
		await expect(action).rejects.toMatchObject({ type: "setGeneralError" } as const);
		await expect(action).rejects.toThrow("An error occurred");
	});

	it("treats non-object JSON as empty and uses fallback", async () => {
		// Arrange
		vi.resetAllMocks();
		const res = makeResponse({
			ok: false,
			status: 422,
			json: async () => {
				await Promise.resolve();
				return "not an object";
			},
		});

		// Act
		const action = runUnwrapped(createApiResponseEffect(res));

		// Assert
		await expect(action).rejects.toMatchObject({ type: "setGeneralError" } as const);
		await expect(action).rejects.toThrow("An error occurred");
	});

	it("propagates the original error when response.json rejects", async () => {
		// Arrange
		vi.resetAllMocks();
		const res = makeResponse({
			ok: false,
			status: 502,
			json: async () => {
				await Promise.resolve();
				throw new Error("bad json");
			},
		});

		// Act
		const promise = Effect.runPromise(createApiResponseEffect(res));

		// Assert
		await expect(promise).rejects.toThrow("bad json");
	});

	it("does not treat empty strings as valid field-specific errors", async () => {
		// Arrange
		vi.resetAllMocks();
		const res = makeResponse({
			ok: false,
			status: 400,
			json: async () => {
				await Promise.resolve();
				return { field: "", error: "" };
			},
		});

		// because the implementation uses `errorData.error ?? "An error occurred"
		// the empty-string message is returned verbatim.

		// Act
		const action = runUnwrapped(createApiResponseEffect(res));

		// Assert
		await expect(action).rejects.toMatchObject({ type: "setGeneralError" } as const);
		await expect(action).rejects.toThrow("");
	});
});
