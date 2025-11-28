import { describe, expect, it, vi } from "vitest";

import { retryWithBackoff } from "@/shared/utils/retryWithBackoff";

describe("retryWithBackoff", () => {
	const ZERO = 0;
	const ONE = 1;
	const TWO = 2;

	it("succeeds immediately when fn returns a value", async () => {
		async function base(): Promise<string> {
			await Promise.resolve();
			return "ok";
		}

		const fn = vi.fn(base);
		const res = await retryWithBackoff(fn, [ZERO]);
		expect(res.succeeded).toBe(true);
		expect(res.value).toBe("ok");
		expect(fn).toHaveBeenCalledTimes(ONE);
	});

	it("retries after an error then succeeds", async () => {
		let calls = 0;

		async function fn(): Promise<string> {
			calls += ONE;
			if (calls === ONE) {
				// make this throw asynchronously
				await Promise.reject(new Error("boom"));
			}
			await Promise.resolve();
			return "ok";
		}

		const res = await retryWithBackoff(fn, [ZERO, ZERO], {
			onError: () => undefined,
		});

		expect(res.succeeded).toBe(true);
		expect(res.value).toBe("ok");
		expect(calls).toBe(TWO);
	});

	it("returns aborted when shouldAbort signals an abort", async () => {
		async function fn(): Promise<never> {
			const errObj = new Error("abort");
			errObj.name = "AbortError";
			await Promise.reject(errObj);
			throw errObj; // unreachable but satisfies types
		}

		const res = await retryWithBackoff(fn, [ZERO, ZERO], {
			shouldAbort: (err) =>
				typeof err === "object" &&
				err !== null &&
				"name" in err &&
				(err as { name?: unknown }).name === "AbortError",
		});

		expect(res.aborted).toBe(true);
		expect(res.succeeded).toBe(false);
	});
});
