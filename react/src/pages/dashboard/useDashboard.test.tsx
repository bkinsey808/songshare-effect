import { renderHook, waitFor } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { getOrCreateAppStore } from "@/react/zustand/useAppStore";
import { SIGNAL_ONE } from "@/shared/constants/http";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { apiAuthSignOutPath } from "@/shared/paths";
import { justRegisteredKey, justSignedOutKey } from "@/shared/sessionStorageKeys";

import useDashboard from "./useDashboard";

vi.mock("react-router-dom");

describe("useDashboard", () => {
	it("consumes sessionStorage one-time signals and exposes alert flags", async () => {
		vi.resetAllMocks();
		sessionStorage.clear();

		sessionStorage.setItem(justRegisteredKey, SIGNAL_ONE);

		const { result } = renderHook(() => useDashboard());

		await waitFor(() => {
			expect(result.current.showRegisteredAlert).toBe(true);
		});

		expect(sessionStorage.getItem(justRegisteredKey)).toBeNull();
	});

	it("signOut does client+server sign-out, sets one-time signal and navigates", async () => {
		vi.resetAllMocks();
		sessionStorage.clear();

		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);

		const mockSignOut = vi.fn();
		const mockSetIsSignedIn = vi.fn();

		// Use the real store instance for this test to avoid constructing a full AppSlice
		const store = getOrCreateAppStore();
		store.setState({ isSignedIn: true, userSessionData: undefined });
		// Spy/replace the slice methods used by the hook (restore after assertions)
		const originalSignOut = store.getState().signOut;
		const originalSetIsSignedIn = store.getState().setIsSignedIn;
		store.getState().signOut = mockSignOut;
		store.getState().setIsSignedIn = mockSetIsSignedIn;

		const mockFetch = vi.fn().mockResolvedValue({ status: 200 });
		vi.stubGlobal("fetch", mockFetch);

		const { result } = renderHook(() => useDashboard());

		await result.current.signOut();

		expect(mockSignOut).toHaveBeenCalledWith();
		expect(mockFetch).toHaveBeenCalledWith(apiAuthSignOutPath, {
			method: "POST",
			credentials: "include",
		});
		expect(mockSetIsSignedIn).toHaveBeenCalledWith(false);
		expect(sessionStorage.getItem(justSignedOutKey)).toBe(SIGNAL_ONE);
		expect(mockNavigate).toHaveBeenCalledWith("/en", { replace: true });

		// Restore the real store methods so other tests are unaffected
		store.getState().signOut = originalSignOut;
		store.getState().setIsSignedIn = originalSetIsSignedIn;
	});

	it("derives currentLang from pathname using strict parser", () => {
		const originalLocation = globalThis.location;

		// Unsupported segment ('fr') should normalize to defaultLanguage
		vi.stubGlobal("location", { pathname: "/fr/dashboard" } as unknown);
		const { result, unmount } = renderHook(() => useDashboard());
		expect(result.current.currentLang).toBe(defaultLanguage);
		unmount();

		// Supported segment ('es') should be preserved
		vi.stubGlobal("location", { pathname: "/es/dashboard" } as unknown);
		const { result: r2 } = renderHook(() => useDashboard());
		expect(r2.current.currentLang).toBe("es");

		// Restore original location
		vi.stubGlobal("location", originalLocation);
	});
});
