import { describe, expect, it, vi } from "vitest";

import handleJustSignedIn from "@/react/auth/handleJustSignedIn";
import {
	justSignedInQueryParam,
	queryParamTokens,
	signinErrorQueryParam,
} from "@/shared/queryParams";
import { retryWithBackoff } from "@/shared/utils/retryWithBackoff";

const signinErrorTokens = queryParamTokens[signinErrorQueryParam];

vi.mock("@/shared/utils/retryWithBackoff");

describe("handleJustSignedIn", () => {
	it("writes sessionStorage and navigates on success", async () => {
		vi.resetAllMocks();
		// ensure clean sessionStorage between tests
		sessionStorage.removeItem(justSignedInQueryParam);
		vi.mocked(retryWithBackoff).mockResolvedValueOnce({ succeeded: true, aborted: false });

		const setSearchParams = vi.fn();
		const navigate = vi.fn();
		const next = new URLSearchParams("a=b");

		await handleJustSignedIn({ next, setSearchParams, navigate });

		// assert the actual storage value instead of spying on the implementation detail
		expect(sessionStorage.getItem(justSignedInQueryParam)).toBe("1");
		expect(setSearchParams).toHaveBeenCalledWith(next, { replace: true });
		expect(navigate).toHaveBeenCalledWith(`${globalThis.location.pathname}?a=b`, { replace: true });
		expect(next.has(signinErrorQueryParam)).toBe(false);
		vi.restoreAllMocks();
	});

	it("sets signin error param on non-aborted failure and navigates", async () => {
		vi.resetAllMocks();
		vi.mocked(retryWithBackoff).mockResolvedValueOnce({
			succeeded: false,
			aborted: false,
			lastError: new Error("server"),
		});

		const setSearchParams = vi.fn();
		const navigate = vi.fn();
		const next = new URLSearchParams("a=b");

		await handleJustSignedIn({ next, setSearchParams, navigate });

		expect(next.get(signinErrorQueryParam)).toBe(signinErrorTokens.serverError);
		expect(setSearchParams).toHaveBeenCalledWith(next, { replace: true });
		expect(navigate).toHaveBeenCalledWith(expect.any(String), { replace: true });
		// `next` should have the signin error token set; navigate will be called with the updated query string
		vi.restoreAllMocks();
	});

	it("does not set signin error when aborted and still navigates", async () => {
		vi.resetAllMocks();
		vi.mocked(retryWithBackoff).mockResolvedValueOnce({
			succeeded: false,
			aborted: true,
			lastError: new Error("abort"),
		});

		const setSearchParams = vi.fn();
		const navigate = vi.fn();
		const next = new URLSearchParams("a=b");

		await handleJustSignedIn({ next, setSearchParams, navigate });

		expect(next.has(signinErrorQueryParam)).toBe(false);
		expect(setSearchParams).toHaveBeenCalledWith(next, { replace: true });
		expect(navigate).toHaveBeenCalledWith(`${globalThis.location.pathname}?a=b`, { replace: true });
	});

	it("continues when sessionStorage.setItem throws", async () => {
		vi.resetAllMocks();
		vi.mocked(retryWithBackoff).mockResolvedValueOnce({ succeeded: true, aborted: false });

		const setSearchParams = vi.fn();
		const navigate = vi.fn();
		const next = new URLSearchParams("a=b");

		vi.spyOn(sessionStorage, "setItem").mockImplementation(() => {
			throw new Error("quota exceeded");
		});

		await expect(handleJustSignedIn({ next, setSearchParams, navigate })).resolves.toBeUndefined();

		expect(setSearchParams).toHaveBeenCalledWith(next, { replace: true });
		expect(navigate).toHaveBeenCalledWith(`${globalThis.location.pathname}?a=b`, { replace: true });

		vi.restoreAllMocks();
	});
});
