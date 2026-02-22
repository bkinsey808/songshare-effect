import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { clientDebug } from "@/react/lib/utils/clientLogger";

import createApiResponseEffect from "./createApiResponseEffect";
import { runUnwrapped } from "./test-utils";

// stub out debug logging so the real implementation isn't called and
// we can easily assert on the calls.  Pattern borrowed from similar tests.
vi.mock("@/react/lib/utils/clientLogger", (): { clientDebug: typeof clientDebug } => ({
	clientDebug: vi.fn(),
}));

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
		vi.resetAllMocks();
		const res = makeResponse({
			ok: false,
			status: 400,
			json: async () => {
				await Promise.resolve();
				return { field: "email", error: "invalid" };
			},
		});

		await expect(runUnwrapped(createApiResponseEffect(res))).rejects.toStrictEqual({
			type: "setFieldError",
			field: "email",
			message: "invalid",
		} as const);

		expect(clientDebug).toHaveBeenCalledWith("🎯 Field-specific error detected");
	});

	it("fails with setGeneralError when there is only a general error string", async () => {
		vi.resetAllMocks();
		const res = makeResponse({
			ok: false,
			status: 500,
			json: async () => {
				await Promise.resolve();
				return { error: "oops" };
			},
		});

		await expect(runUnwrapped(createApiResponseEffect(res))).rejects.toStrictEqual({
			type: "setGeneralError",
			message: "oops",
		} as const);

		expect(clientDebug).toHaveBeenCalledWith("🚨 General error detected");
	});

	it("converts missing/undefined error into fallback message", async () => {
		vi.resetAllMocks();
		const res = makeResponse({
			ok: false,
			status: 418,
			json: async () => {
				await Promise.resolve();
				return {};
			},
		});

		await expect(runUnwrapped(createApiResponseEffect(res))).rejects.toStrictEqual({
			type: "setGeneralError",
			message: "An error occurred",
		} as const);
	});

	it("treats non-object JSON as empty and uses fallback", async () => {
		vi.resetAllMocks();
		const res = makeResponse({
			ok: false,
			status: 422,
			json: async () => {
				await Promise.resolve();
				return "not an object";
			},
		});

		await expect(runUnwrapped(createApiResponseEffect(res))).rejects.toStrictEqual({
			type: "setGeneralError",
			message: "An error occurred",
		} as const);
	});

	it("propagates the original error when response.json rejects", async () => {
		vi.resetAllMocks();
		const res = makeResponse({
			ok: false,
			status: 502,
			json: async () => {
				await Promise.resolve();
				throw new Error("bad json");
			},
		});

		await expect(Effect.runPromise(createApiResponseEffect(res))).rejects.toThrow("bad json");
	});

	it("does not treat empty strings as valid field-specific errors", async () => {
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
		await expect(runUnwrapped(createApiResponseEffect(res))).rejects.toStrictEqual({
			type: "setGeneralError",
			message: "",
		} as const);
	});
});
