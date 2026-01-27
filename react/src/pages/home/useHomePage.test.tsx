import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
	displayedKey,
	justDeletedAccountKey,
	justSignedOutKey,
	typeKey,
} from "@/shared/sessionStorageKeys";

import useHomePage from "./useHomePage";

// covers initial state, sentinel handling, transient flag cleanup, `dismissAlert`
// behavior, and how the hook behaves when `sessionStorage` operations throw in
// restricted environments.
describe("useHomePage", () => {
	it("initializes with no alert when no session keys are set", () => {
		// Arrange
		sessionStorage.clear();

		// Act
		const { result } = renderHook(() => useHomePage());

		// Assert
		expect(result.current.alertState).toStrictEqual({ visible: false, type: "" });
	});

	it("respects an already-displayed sentinel and stored type", () => {
		// Arrange
		sessionStorage.clear();
		sessionStorage.setItem(displayedKey, "1");
		sessionStorage.setItem(typeKey, "storedType");

		// Act
		const { result } = renderHook(() => useHomePage());

		// Assert
		expect(result.current.alertState).toStrictEqual({ visible: true, type: "storedType" });
	});

	it("treats a displayed sentinel with empty type as no alert", () => {
		// Arrange
		sessionStorage.clear();
		sessionStorage.setItem(displayedKey, "1");
		sessionStorage.setItem(typeKey, "");

		// Act
		const { result } = renderHook(() => useHomePage());

		// Assert
		expect(result.current.alertState).toStrictEqual({ visible: false, type: "" });
	});

	// Ensures a transient delete flag results in an alert being shown, that a
	// sentinel and type are persisted for subsequent renders, and that the
	// original transient flags are removed from storage.
	it("initializes from transient delete flag and cleans up storage", () => {
		// Arrange
		sessionStorage.clear();
		sessionStorage.setItem(justDeletedAccountKey, "1");

		// Act
		const { result } = renderHook(() => useHomePage());

		// Assert - visible and type set
		expect(result.current.alertState).toStrictEqual({ visible: true, type: "deleteSuccess" });
		// Assert - sentinel and type persisted
		expect(sessionStorage.getItem(displayedKey)).toBe("1");
		expect(sessionStorage.getItem(typeKey)).toBe("deleteSuccess");
		// Transient flag should be removed
		expect(sessionStorage.getItem(justDeletedAccountKey)).toBeNull();
	});

	// When both delete and sign-out flags are present, sign-out should take
	// precedence and its corresponding alert type should be persisted.
	it("sign-out flag takes precedence over delete flag", () => {
		// Arrange
		sessionStorage.clear();
		sessionStorage.setItem(justDeletedAccountKey, "1");
		sessionStorage.setItem(justSignedOutKey, "1");

		// Act
		const { result } = renderHook(() => useHomePage());

		// Assert - sign out wins
		expect(result.current.alertState).toStrictEqual({ visible: true, type: "signOutSuccess" });
		expect(sessionStorage.getItem(displayedKey)).toBe("1");
		expect(sessionStorage.getItem(typeKey)).toBe("signOutSuccess");
		expect(sessionStorage.getItem(justDeletedAccountKey)).toBeNull();
		expect(sessionStorage.getItem(justSignedOutKey)).toBeNull();
	});

	// `dismissAlert` is a best-effort cleanup helper: it should hide the UI
	// alert state and remove related session keys when possible without
	// throwing if storage operations fail.
	it("dismissAlert hides the alert and clears related session keys", async () => {
		// Arrange
		sessionStorage.clear();
		sessionStorage.setItem(displayedKey, "1");
		sessionStorage.setItem(typeKey, "deleteSuccess");

		const { result } = renderHook(() => useHomePage());
		expect(result.current.alertState.visible).toBe(true);

		// Act
		result.current.dismissAlert();

		// Assert - state cleared (state updates may be scheduled, wait for it)
		await waitFor(() => {
			expect(result.current.alertState).toStrictEqual({ visible: false, type: "" });
		});

		// Assert - storage keys removed (best-effort)
		expect(sessionStorage.getItem(displayedKey)).toBeNull();
		expect(sessionStorage.getItem(typeKey)).toBeNull();
		expect(sessionStorage.getItem(justDeletedAccountKey)).toBeNull();
	});

	// Simulate storage errors by making `sessionStorage.removeItem` throw.
	// The hook should swallow these exceptions; we use `vi.spyOn(...).mockImplementation`
	// and restore the spy after the assertion.
	it("dismissAlert swallows storage errors and does not throw", () => {
		// Arrange
		sessionStorage.clear();
		sessionStorage.setItem(displayedKey, "1");
		sessionStorage.setItem(typeKey, "deleteSuccess");

		// Spy on removeItem to throw to simulate storage errors
		const removeSpy = vi.spyOn(sessionStorage, "removeItem").mockImplementation(() => {
			throw new Error("no storage");
		});

		const { result } = renderHook(() => useHomePage());

		// Act / Assert - should not throw
		expect(() => {
			result.current.dismissAlert();
		}).not.toThrow();

		// cleanup - restore
		removeSpy.mockRestore();
	});
});
