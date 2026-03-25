import { describe, expect, it, vi } from "vitest";

import { ONE, TWO, ZERO } from "@/shared/constants/shared-constants";
import { retryWithBackoff } from "@/shared/utils/retryWithBackoff";

/**
 * @returns "ok"
 */
async function base(): Promise<string> {
	// Keep an await to avoid `require-await` warnings while still being trivial
	await Promise.resolve();
	return "ok";
}

/**
 * @returns a rejected promise
 */
function abortingFn(): Promise<never> {
	const errObj = new Error("abort");
	errObj.name = "AbortError";
	return Promise.reject(errObj);
}

/**
 * @param err - error to check
 * @returns true if it is an abort error
 */
function isAbortError(err: unknown): boolean {
	return err instanceof Error && err.name === "AbortError";
}

describe("retryWithBackoff", () => {
	it("succeeds immediately when fn returns a value", async () => {
		// Arrange
		const fn = vi.fn(base);

		// Act
		const res = await retryWithBackoff(fn, [ZERO]);

		// Assert
		expect(res.succeeded).toBe(true);
		expect(res.value).toBe("ok");
		expect(fn).toHaveBeenCalledTimes(ONE);
	});

	it("retries after an error then succeeds", async () => {
		// Arrange: first call fails, then succeeds
		const fn = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValue("ok");

		// Act
		const res = await retryWithBackoff(fn, [ZERO, ZERO], {
			onError: () => undefined,
		});

		// Assert
		expect(res.succeeded).toBe(true);
		expect(res.value).toBe("ok");
		expect(fn).toHaveBeenCalledTimes(TWO);
	});

	it("returns aborted when shouldAbort signals an abort", async () => {
		// Arrange
		const fn = abortingFn;

		// Act
		const res = await retryWithBackoff(fn, [ZERO, ZERO], {
			// `shouldAbort` should return true when the error indicates an abort.
			shouldAbort: isAbortError,
		});

		// Assert
		expect(res.aborted).toBe(true);
		expect(res.succeeded).toBe(false);
	});
});
