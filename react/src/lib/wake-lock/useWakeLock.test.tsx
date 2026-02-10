import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import { getWakeLockSentinel, setWakeLockSentinel } from "@/react/lib/wake-lock/sentinel";
import useWakeLock from "@/react/lib/wake-lock/useWakeLock";

const CALLED_ONCE = 1;
const CALLED_TWICE = 2;

function TestComponent(): ReactElement {
	const { isWakeLockActive, toggleWakeLock, isSupported } = useWakeLock();
	return (
		<div>
			<span data-testid="active">{String(isWakeLockActive)}</span>
			<span data-testid="supported">{String(isSupported)}</span>
			<button data-testid="toggle" onClick={toggleWakeLock}>
				Toggle
			</button>
		</div>
	);
}

/**
 * Temporarily set `navigator.wakeLock` presence for a test and return a cleanup
 * function that restores the original value.
 */
function setNavigatorWakeLockPresent(present: boolean): () => void {
	const original = Reflect.get(navigator, "wakeLock");
	if (present) {
		Reflect.set(navigator, "wakeLock", {});
	} else {
		Reflect.deleteProperty(navigator, "wakeLock");
	}
	return (): void => {
		Reflect.set(navigator, "wakeLock", original);
	};
}

/**
 * Temporarily override document.visibilityState for a test and return a cleanup
 * function that restores the original descriptor.
 */
function overrideDocumentVisibilityState(value: "visible" | "hidden"): () => void {
	const original = Object.getOwnPropertyDescriptor(Document.prototype, "visibilityState");
	Object.defineProperty(document, "visibilityState", {
		configurable: true,
		get: () => value,
	});
	return (): void => {
		if (original) {
			Object.defineProperty(Document.prototype, "visibilityState", original);
		} else {
			Object.defineProperty(document, "visibilityState", {
				configurable: true,
				get: () => "visible",
			});
		}
	};
}

describe("useWakeLock", () => {
	// When Wake Lock API is absent, the hook reports unsupported and never acquires a lock
	it("reports unsupported when Wake Lock API is missing", () => {
		cleanup();
		setWakeLockSentinel(undefined);
		const restoreNav = setNavigatorWakeLockPresent(false);

		const { getByTestId } = render(<TestComponent />);
		expect(getByTestId("supported").textContent).toBe("false");
		expect(getByTestId("active").textContent).toBe("false");

		cleanup();
		restoreNav();
	});

	// When supported, the hook should request a wake lock on mount and reflect active state
	it("requests wake lock on mount when supported", async () => {
		cleanup();
		setWakeLockSentinel(undefined);
		const restoreNav = setNavigatorWakeLockPresent(true);
		const reqSpy = await spyImport("@/react/lib/wake-lock/requestWakeLock");
		reqSpy.mockResolvedValue(true);

		const { getByTestId } = render(<TestComponent />);

		await waitFor(() => {
			expect(getByTestId("active").textContent).toBe("true");
		});

		expect(reqSpy).toHaveBeenCalledTimes(CALLED_ONCE);

		cleanup();
		restoreNav();
		vi.restoreAllMocks();
	});

	// Toggle behavior: when active, toggle should release; when inactive, toggle should request
	it("toggleWakeLock calls release when active and request when inactive", async () => {
		cleanup();
		setWakeLockSentinel(undefined);
		const restoreNav = setNavigatorWakeLockPresent(true);

		// initial mount acquires the lock
		const reqSpy = await spyImport("@/react/lib/wake-lock/requestWakeLock");
		const releaseSpy = await spyImport("@/react/lib/wake-lock/releaseWakeLock");
		reqSpy.mockResolvedValue(true);
		releaseSpy.mockResolvedValue();

		const { getByTestId } = render(<TestComponent />);
		await waitFor(() => {
			expect(getByTestId("active").textContent).toBe("true");
		});

		// toggle to release
		fireEvent.click(getByTestId("toggle"));
		await waitFor(() => {
			expect(getByTestId("active").textContent).toBe("false");
		});
		expect(releaseSpy).toHaveBeenCalledTimes(CALLED_ONCE);

		// prepare request to succeed again and toggle to re-request
		reqSpy.mockResolvedValueOnce(true);
		fireEvent.click(getByTestId("toggle"));
		await waitFor(() => {
			expect(getByTestId("active").textContent).toBe("true");
		});
		expect(reqSpy).toHaveBeenCalledTimes(CALLED_TWICE); // initial mount + this toggle

		cleanup();
		restoreNav();
		vi.restoreAllMocks();
	});

	// When the document becomes visible again and there is no sentinel, the hook should re-request
	it("re-requests wake lock on visibilitychange when sentinel is undefined", async () => {
		cleanup();
		setWakeLockSentinel(undefined);
		const restoreNav = setNavigatorWakeLockPresent(true);

		const reqSpy = await spyImport("@/react/lib/wake-lock/requestWakeLock");
		reqSpy.mockResolvedValue(true);

		const restoreVis = overrideDocumentVisibilityState("hidden");
		const { getByTestId } = render(<TestComponent />);

		// initial request
		await waitFor(() => {
			expect(getByTestId("active").textContent).toBe("true");
		});

		expect(reqSpy).toHaveBeenCalledTimes(CALLED_ONCE);

		// simulate visibility change to visible -> should trigger a second request
		Object.defineProperty(document, "visibilityState", {
			configurable: true,
			get: () => "visible",
		});
		document.dispatchEvent(new Event("visibilitychange"));

		await waitFor(() => {
			expect(reqSpy).toHaveBeenCalledTimes(CALLED_TWICE);
		});

		cleanup();
		restoreVis();
		restoreNav();
		vi.restoreAllMocks();
	});

	// On unmount the hook should attempt to release any held wake lock
	it("releases wake lock on unmount", async () => {
		cleanup();
		setWakeLockSentinel(undefined);
		const restoreNav = setNavigatorWakeLockPresent(true);
		const releaseSpy = await spyImport("@/react/lib/wake-lock/releaseWakeLock");
		const reqSpy = await spyImport("@/react/lib/wake-lock/requestWakeLock");
		releaseSpy.mockResolvedValue();
		reqSpy.mockResolvedValue(true);

		const { getByTestId } = render(<TestComponent />);
		await waitFor(() => {
			expect(getByTestId("active").textContent).toBe("true");
		});

		cleanup();
		expect(releaseSpy).toHaveBeenCalledTimes(CALLED_ONCE);

		restoreNav();
		vi.restoreAllMocks();
	});

	// Ensure any leaked sentinel state is cleared between tests
	it("cleans up sentinel state after tests", () => {
		setWakeLockSentinel(undefined);
		expect(getWakeLockSentinel()).toBeUndefined();
	});
});
