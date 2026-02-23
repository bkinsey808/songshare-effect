import { describe, expect, it, vi } from "vitest";

import delay from "@/shared/utils/delay";

import getSupabaseAuthToken from "../auth-token/getSupabaseAuthToken";
import getSupabaseClient from "./getSupabaseClient";
import getSupabaseClientWithAuth from "./getSupabaseClientWithAuth";
import { makeFakeClient } from "./test-util";

vi.mock("../auth-token/getSupabaseAuthToken");
vi.mock("./getSupabaseClient");
vi.mock("@/shared/utils/delay");

describe("getSupabaseClientWithAuth", () => {
	it("returns a client when a valid token is available on first attempt", async () => {
		// make sure previous test invocations don't pollute expectations
		vi.resetAllMocks();

		const fakeClient = makeFakeClient();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("valid-token");
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);

		const result = await getSupabaseClientWithAuth();

		expect(result).toBe(fakeClient);
		expect(vi.mocked(delay)).not.toHaveBeenCalled();
	});

	it("returns undefined when auth token is missing on every retry", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(undefined);

		// use just two retries to speed test
		const retries = 2;
		const result = await getSupabaseClientWithAuth(retries);

		expect(result).toBeUndefined();
		// there should be one backoff before the second attempt
		const expectedBackoffs = 1;
		expect(vi.mocked(delay)).toHaveBeenCalledTimes(expectedBackoffs);
	});

	it("treats empty string token same as undefined and retries", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("");

		const retries = 1;
		const result = await getSupabaseClientWithAuth(retries);

		expect(result).toBeUndefined();
		expect(vi.mocked(delay)).not.toHaveBeenCalled();
	});

	it("logs errors and stops after last attempt", async () => {
		vi.resetAllMocks();
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		vi.mocked(getSupabaseAuthToken).mockRejectedValue(new Error("network"));

		const retries = 2;
		const result = await getSupabaseClientWithAuth(retries);

		expect(result).toBeUndefined();
		// should include final failure message in logged calls
		expect(errorSpy.mock.calls).toStrictEqual(
			expect.arrayContaining([
				expect.arrayContaining([expect.stringContaining("All retry attempts failed")]),
			]),
		);
		errorSpy.mockRestore();
	});

	it("waits increasing backoff values between failed attempts and succeeds eventually", async () => {
		vi.resetAllMocks();
		const calls: number[] = [];
		vi.mocked(delay).mockImplementation(((ms: number) => {
			calls.push(ms);
			return Promise.resolve();
		}) as typeof delay);

		const fakeClient = makeFakeClient();
		const tokenMock = vi.mocked(getSupabaseAuthToken);

		// first attempt returns undefined (fail), second returns valid token
		tokenMock.mockResolvedValueOnce(undefined).mockResolvedValueOnce("t");
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);

		const maxAttempts = 3;
		const result = await getSupabaseClientWithAuth(maxAttempts);
		expect(result).toBe(fakeClient);

		// first failure produced one delay; value should equal MS_IN_SECOND * BACKOFF_BASE^(attempt-1)
		// internal constants: MS_IN_SECOND=1000, BACKOFF_BASE=2, first attempt-> attempt=1 -> exponent 0 -> 1000
		const expectedDelay = 1000;
		expect(calls).toStrictEqual([expectedDelay]);
	});

	it("returns undefined when getSupabaseClient yields falsy value", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		const retries = 1;
		const result = await getSupabaseClientWithAuth(retries);
		expect(result).toBeUndefined();
	});
});
