import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { hydrationState } from "@/react/app-store/hydration";
import useAppStoreHydrated from "@/react/app-store/useAppStoreHydrated";
import { ONE, ZERO } from "@/shared/constants/shared-constants";

describe("useAppStoreHydrated", () => {
	it("should return true when hydrationState.isHydrated is initially true", () => {
		hydrationState.isHydrated = true;
		hydrationState.listeners.clear();

		const { result } = renderHook(() => useAppStoreHydrated());

		expect(result.current.isHydrated).toBe(true);
		expect(hydrationState.listeners.size).toBe(ZERO);
	});

	it("should register a listener when not hydrated and update state when listener runs", async () => {
		hydrationState.isHydrated = false;
		hydrationState.listeners.clear();

		const { result } = renderHook(() => useAppStoreHydrated());

		expect(result.current.isHydrated).toBe(false);
		expect(hydrationState.listeners.size).toBe(ONE);

		// Simulate hydration by flipping the flag and invoking listeners
		hydrationState.isHydrated = true;

		for (const listener of hydrationState.listeners) {
			listener();
		}

		await waitFor(() => {
			expect(result.current.isHydrated).toBe(true);
		});
	});

	it("should remove listener on unmount", () => {
		hydrationState.isHydrated = false;
		hydrationState.listeners.clear();

		const { unmount } = renderHook(() => useAppStoreHydrated());

		expect(hydrationState.listeners.size).toBe(ONE);

		unmount();

		expect(hydrationState.listeners.size).toBe(ZERO);
	});
});
