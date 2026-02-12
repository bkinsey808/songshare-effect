import { renderHook, waitFor } from "@testing-library/react";
import { useSearchParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ONE_CALL } from "@/react/lib/test-helpers/test-consts";
import { providerQueryParam, signinErrorQueryParam } from "@/shared/queryParams";

import useSignInError from "./useSignInError";

vi.mock("react-router-dom");

describe("useSignInError", () => {
	it("maps token to translation key and reads provider", () => {
		vi.resetAllMocks();

		const params = new URLSearchParams();
		params.set(signinErrorQueryParam, "providerMismatch");
		params.set(providerQueryParam, "github");

		const mockSetSearchParams = vi.fn();
		vi.mocked(useSearchParams).mockReturnValue([params, mockSetSearchParams]);

		const { result } = renderHook(() => useSignInError());

		expect(result.current.signinError).toBe("errors.signin.providerMismatch");
		expect(result.current.provider).toBe("github");
		expect(mockSetSearchParams).toHaveBeenCalledTimes(ONE_CALL);
	});

	it("does not map unknown token to a signinError key but still removes params", () => {
		vi.resetAllMocks();
		const params = new URLSearchParams();
		params.set(signinErrorQueryParam, "not-a-token");
		params.set(providerQueryParam, "gitlab");

		const mockSetSearchParams = vi.fn();
		vi.mocked(useSearchParams).mockReturnValue([params, mockSetSearchParams]);

		const { result } = renderHook(() => useSignInError());

		expect(result.current.signinError).toBeUndefined();
		expect(result.current.provider).toBe("gitlab");
		expect(mockSetSearchParams).toHaveBeenCalledTimes(ONE_CALL);
	});

	it("dismissError clears the signinError and attempts to remove params", async () => {
		vi.resetAllMocks();
		const params = new URLSearchParams();
		params.set(signinErrorQueryParam, "providerMismatch");

		const mockSetSearchParams = vi.fn();
		vi.mocked(useSearchParams).mockReturnValue([params, mockSetSearchParams]);

		const { result } = renderHook(() => useSignInError());

		// initial state is set
		expect(result.current.signinError).toBe("errors.signin.providerMismatch");

		result.current.dismissError();

		await waitFor(() => {
			expect(result.current.signinError).toBeUndefined();
			// dismissError should call setSearchParams again to remove params
			expect(mockSetSearchParams).toHaveBeenCalledTimes(ONE_CALL + ONE_CALL);
		});
	});

	it("dismissError swallows errors thrown by setSearchParams", () => {
		vi.resetAllMocks();

		const params = new URLSearchParams();
		const throwing = vi.fn(() => {
			throw new Error("boom");
		});
		vi.mocked(useSearchParams).mockReturnValue([params, throwing]);

		const { result } = renderHook(() => useSignInError());
		// calling dismissError should not throw even if the setter throws
		expect(() => {
			result.current.dismissError();
		}).not.toThrow();
	});
});
