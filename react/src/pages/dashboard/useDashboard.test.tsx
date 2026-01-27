import { renderHook, waitFor } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { getOrCreateAppStore } from "@/react/zustand/useAppStore";
import { SIGNAL_ONE } from "@/shared/constants/http";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { apiAuthSignOutPath } from "@/shared/paths";
import { justRegisteredKey, justSignedOutKey, justUnauthorizedAccessKey } from "@/shared/sessionStorageKeys";
import { justSignedInQueryParam } from "@/shared/queryParams";

import useDashboard from "./useDashboard";

// Mock router hooks (e.g., useNavigate) so tests can assert navigation without real routing.
vi.mock("react-router-dom");

// Tests for the dashboard hook: session signals, sign-out flow, and URL language parsing.
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
		// Stub global fetch to avoid network calls and control sign-out response shape.
		const originalFetch = globalThis.fetch;
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

		// Restore global fetch to avoid leaking the stub into other tests
		vi.stubGlobal("fetch", originalFetch);
	});

	it("consumes justSignedInQueryParam and exposes signed-in alert", async () => {
		vi.resetAllMocks();
		sessionStorage.clear();

		sessionStorage.setItem(justSignedInQueryParam, SIGNAL_ONE);

		const { result } = renderHook(() => useDashboard());

		await waitFor(() => {
			expect(result.current.showSignedInAlert).toBe(true);
		});

		expect(sessionStorage.getItem(justSignedInQueryParam)).toBeNull();
	});

	it("consumes justUnauthorizedAccessKey and exposes unauthorized alert", async () => {
		vi.resetAllMocks();
		sessionStorage.clear();

		sessionStorage.setItem(justUnauthorizedAccessKey, SIGNAL_ONE);

		const { result } = renderHook(() => useDashboard());

		await waitFor(() => {
			expect(result.current.showUnauthorizedAlert).toBe(true);
		});

		expect(sessionStorage.getItem(justUnauthorizedAccessKey)).toBeNull();
	});

	it("signOut still completes when fetch rejects", async () => {
		vi.resetAllMocks();
		sessionStorage.clear();

		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);

		const mockSignOut = vi.fn();
		const mockSetIsSignedIn = vi.fn();

		const store = getOrCreateAppStore();
		store.setState({ isSignedIn: true, userSessionData: undefined });
		const originalSignOut2 = store.getState().signOut;
		const originalSetIsSignedIn2 = store.getState().setIsSignedIn;
		store.getState().signOut = mockSignOut;
		store.getState().setIsSignedIn = mockSetIsSignedIn;

		const mockFetch = vi.fn().mockRejectedValue(new Error("network"));
		const originalFetch2 = globalThis.fetch;
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

		// Restore
		store.getState().signOut = originalSignOut2;
		store.getState().setIsSignedIn = originalSetIsSignedIn2;
		vi.stubGlobal("fetch", originalFetch2);
	});

	it("signOut navigates to default language when currentLang unsupported", async () => {
		vi.resetAllMocks();
		sessionStorage.clear();

		const originalLocation = globalThis.location;
		vi.stubGlobal("location", { pathname: "/fr/dashboard" } as unknown);

		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);

		const mockSignOut2 = vi.fn();
		const mockSetIsSignedIn2 = vi.fn();

		const store2 = getOrCreateAppStore();
		store2.setState({ isSignedIn: true, userSessionData: undefined });
		const originalSignOut3 = store2.getState().signOut;
		const originalSetIsSignedIn3 = store2.getState().setIsSignedIn;
		store2.getState().signOut = mockSignOut2;
		store2.getState().setIsSignedIn = mockSetIsSignedIn2;

		const mockFetch2 = vi.fn().mockResolvedValue({ status: 200 });
		const originalFetch3 = globalThis.fetch;
		vi.stubGlobal("fetch", mockFetch2);

		const { result } = renderHook(() => useDashboard());

		await result.current.signOut();

		expect(mockNavigate).toHaveBeenCalledWith("/en", { replace: true });

		// Restore
		vi.stubGlobal("location", originalLocation);
		vi.stubGlobal("fetch", originalFetch3);
		store2.getState().signOut = originalSignOut3;
		store2.getState().setIsSignedIn = originalSetIsSignedIn3;
	});

	it("derives currentLang from pathname using strict parser", () => {
		// Save original location so it can be restored after stubbing global.location.
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
