import { renderHook, waitFor } from "@testing-library/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { describe, expect, it, vi, type Mock } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useEnsureSignedIn from "@/react/auth/ensure-signed-in/useEnsureSignedIn";
import handleJustSignedIn from "@/react/auth/handleJustSignedIn";
import { justSignedInQueryParam } from "@/shared/queryParams";

import useRequireAuthBoundary from "./useRequireAuthBoundary";

vi.mock("react-router-dom");
vi.mock("@/react/auth/handleJustSignedIn");
vi.mock("@/react/auth/ensure-signed-in/useEnsureSignedIn");
vi.mock("@/react/app-store/useAppStore");

describe("useRequireAuthBoundary", () => {
	it("returns isSignedIn and justSignedIn=false when param absent and does not call handleJustSignedIn", () => {
		vi.resetAllMocks();

		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);

		const mockSetSearchParams = vi.fn();
		const mockGet = vi.fn().mockReturnValue(undefined);
		const mockToString = vi.fn().mockReturnValue("");
		const mockSearchParams = new URLSearchParams();
		mockSearchParams.get = mockGet;
		mockSearchParams.toString = mockToString;

		vi.mocked(useSearchParams).mockReturnValue([mockSearchParams, mockSetSearchParams]);

		// Mock the app store selector to return isSignedIn true
		vi.mocked(useAppStore).mockImplementation((_selector: unknown) => true as unknown);

		vi.mocked(useEnsureSignedIn).mockImplementation(() => undefined);

		const { result } = renderHook(() => useRequireAuthBoundary());

		expect(result.current.justSignedIn).toBe(false);
		expect(result.current.isSignedIn).toBe(true);
		expect(vi.mocked(handleJustSignedIn)).not.toHaveBeenCalled();
		expect(vi.mocked(useEnsureSignedIn)).toHaveBeenCalledWith();
	});

	it("calls handleJustSignedIn when justSignedIn=1", async () => {
		vi.resetAllMocks();

		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);

		const mockSetSearchParams = vi.fn();
		const mockGet = vi.fn().mockReturnValue("1");
		const mockToString = vi.fn().mockReturnValue(`${justSignedInQueryParam}=1&a=b`);
		const mockSearchParams = new URLSearchParams();
		mockSearchParams.get = mockGet;
		mockSearchParams.toString = mockToString;

		vi.mocked(useSearchParams).mockReturnValue([mockSearchParams, mockSetSearchParams]);

		vi.mocked(useAppStore).mockImplementation((_selector: unknown) => false as unknown);
		vi.mocked(useEnsureSignedIn).mockImplementation(() => undefined);

		const { result } = renderHook(() => useRequireAuthBoundary());

		await waitFor(() => {
			expect(result.current.justSignedIn).toBe(true);
		});

		expect(vi.mocked(handleJustSignedIn)).toHaveBeenCalledWith(expect.anything());
	});

	it("passes correct arguments to handleJustSignedIn", async () => {
		vi.resetAllMocks();

		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);

		const mockSetSearchParams = vi.fn();
		const mockGet = vi.fn().mockReturnValue("1");
		const mockToString = vi.fn().mockReturnValue(`${justSignedInQueryParam}=1&a=b`);
		const mockSearchParams = new URLSearchParams();
		mockSearchParams.get = mockGet;
		mockSearchParams.toString = mockToString;

		vi.mocked(useSearchParams).mockReturnValue([mockSearchParams, mockSetSearchParams]);

		vi.mocked(useAppStore).mockImplementation((_selector: unknown) => false as unknown);
		vi.mocked(useEnsureSignedIn).mockImplementation(() => undefined);

		renderHook(() => useRequireAuthBoundary());

		await waitFor(() => {
			expect(vi.mocked(handleJustSignedIn)).toHaveBeenCalledWith(expect.anything());
		});

		const mockedHandler = vi.mocked(handleJustSignedIn) as Mock;
		const EXPECTED_CALL_COUNT = 1;
		const EXPECTED_ARG_COUNT = 1;
		const FIRST_CALL_INDEX = 0;
		expect(mockedHandler.mock.calls).toHaveLength(EXPECTED_CALL_COUNT);
		const [callArgs] = mockedHandler.mock.calls.slice(FIRST_CALL_INDEX, EXPECTED_CALL_COUNT);
		expect(callArgs).toBeDefined();
		expect(callArgs).toHaveLength(EXPECTED_ARG_COUNT);
	});
});
