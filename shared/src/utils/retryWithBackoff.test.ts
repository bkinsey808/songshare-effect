import { describe, expect, it, vi } from "vitest";

import { retryWithBackoff } from "@/shared/utils/retryWithBackoff";

const ZERO = 0;
const ONE = 1;
const TWO = 2;

// simple base function used by the first test
async function base(): Promise<string> {
	// Keep an await to avoid `require-await` warnings while still being trivial
	await Promise.resolve();
	return "ok";
}

// Return a rejected promise to simulate an aborting error. Kept at module scope
// so the test body remains free of conditionals and function-scoping warnings.
function abortingFn(): Promise<never> {
	const errObj = new Error("abort");
	errObj.name = "AbortError";
	return Promise.reject(errObj);
}

function isAbortError(err: unknown): boolean {
	return err instanceof Error && err.name === "AbortError";
}

describe("retryWithBackoff", () => {
	it("succeeds immediately when fn returns a value", async () => {
		const fn = vi.fn(base);
		const res = await retryWithBackoff(fn, [ZERO]);
		expect(res.succeeded).toBe(true);
		expect(res.value).toBe("ok");
		expect(fn).toHaveBeenCalledTimes(ONE);
	});

	it("retries after an error then succeeds", async () => {
		// Simulate first call failing then subsequent calls succeeding
		const fn = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValue("ok");

		const res = await retryWithBackoff(fn, [ZERO, ZERO], {
			onError: () => undefined,
		});

		expect(res.succeeded).toBe(true);
		expect(res.value).toBe("ok");
		expect(fn).toHaveBeenCalledTimes(TWO);
	});

	it("returns aborted when shouldAbort signals an abort", async () => {
		const fn = abortingFn;

		const res = await retryWithBackoff(fn, [ZERO, ZERO], {
			// `shouldAbort` should return true when the error indicates an abort.
			shouldAbort: isAbortError,
		});

		expect(res.aborted).toBe(true);
		expect(res.succeeded).toBe(false);
	});
});
