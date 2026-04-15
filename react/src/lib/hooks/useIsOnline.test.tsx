import { cleanup, render, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useIsOnline from "./useIsOnline";

describe("useIsOnline — renderHook", () => {
	it("returns initial navigator.onLine value", () => {
		vi.stubGlobal("navigator", { onLine: true });
		const { result } = renderHook(() => useIsOnline());
		expect(result.current).toBe(true);
		vi.unstubAllGlobals();
	});

	it("returns false when navigator.onLine is false initially", () => {
		vi.stubGlobal("navigator", { onLine: false });
		const { result } = renderHook(() => useIsOnline());
		expect(result.current).toBe(false);
		vi.unstubAllGlobals();
	});

	it("updates to true when online event fires", async () => {
		vi.stubGlobal("navigator", { onLine: false });
		const { result } = renderHook(() => useIsOnline());
		expect(result.current).toBe(false);

		globalThis.dispatchEvent(new Event("online"));

		await waitFor(() => {
			expect(result.current).toBe(true);
		});
		vi.unstubAllGlobals();
	});

	it("updates to false when offline event fires", async () => {
		vi.stubGlobal("navigator", { onLine: true });
		const { result } = renderHook(() => useIsOnline());
		expect(result.current).toBe(true);

		globalThis.dispatchEvent(new Event("offline"));

		await waitFor(() => {
			expect(result.current).toBe(false);
		});
		vi.unstubAllGlobals();
	});
});

describe("useIsOnline — Harness", () => {
	it("harness renders online status when navigator.onLine is true", () => {
		cleanup();
		vi.stubGlobal("navigator", { onLine: true });

		/**
		 * Test harness component that renders the online status using the hook.
		 *
		 * @returns ReactElement showing online status
		 */
		function Harness(): ReactElement {
			const online = useIsOnline();
			return <div data-testid="status">{String(online)}</div>;
		}

		const { getByTestId } = render(<Harness />);
		expect(getByTestId("status").textContent).toBe("true");
		vi.unstubAllGlobals();
	});
});
