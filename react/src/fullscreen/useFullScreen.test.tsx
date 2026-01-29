import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useFullScreen from "@/react/fullscreen/useFullScreen";

const CALLED_ONCE = 1;

/**
 * Ensure `requestFullscreen` and `exitFullscreen` exist on the test DOM so
 * the tests can spy on them in environments (like jsdom) that don't define
 * these functions by default. Returns a cleanup function that restores the
 * original state.
 */
function ensureFullscreenMethods(): () => void {
	const hadReq = "requestFullscreen" in document.documentElement;
	const hadExit = "exitFullscreen" in document;
	if (!hadReq) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion
		(document.documentElement as any).requestFullscreen = async (): Promise<void> => {
			await Promise.resolve();
		};
	}
	if (!hadExit) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion
		(document as any).exitFullscreen = async (): Promise<void> => {
			await Promise.resolve();
		};
	}
	return (): void => {
		if (!hadReq) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion
			delete (document.documentElement as any).requestFullscreen;
		}
		if (!hadExit) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion
			delete (document as any).exitFullscreen;
		}
	};
}

function TestComponent(): React.ReactElement {
	const { isFullScreen, toggleFullScreen, enterFullScreen, exitFullScreen } = useFullScreen();

	return (
		<div>
			<span data-testid="is">{String(isFullScreen)}</span>
			<button data-testid="toggle" onClick={toggleFullScreen}>
				Toggle
			</button>
			<button data-testid="enter" onClick={() => void enterFullScreen()}>
				Enter
			</button>
			<button data-testid="exit" onClick={() => void exitFullScreen()}>
				Exit
			</button>
		</div>
	);
}

/**
 * Temporarily override `document.fullscreenElement` for tests.
 *
 * This simulates being in or out of fullscreen by adding a custom getter to
 * `document`. The returned cleanup function restores the original property
 * descriptor (or resets it to an undefined getter when none existed).
 *
 * @param value - Element to return from `document.fullscreenElement`, or undefined
 * @returns cleanup function
 */
function overrideFullscreenElement(value: Element | null | undefined): () => void {
	const original = Object.getOwnPropertyDescriptor(Document.prototype, "fullscreenElement");

	Object.defineProperty(document, "fullscreenElement", {
		configurable: true,
		// Use a typed getter rather than unsafe casts to avoid narrowing assertions
		get: (): Element | null | undefined => value,
	});

	return (): void => {
		if (original) {
			Object.defineProperty(Document.prototype, "fullscreenElement", original);
		} else {
			// If there was no original descriptor, reset to null getter
			Object.defineProperty(document, "fullscreenElement", {
				configurable: true,
				// eslint-disable-next-line unicorn/no-null
				get: () => null,
			});
		}
	};
}

describe("useFullScreen", () => {
	// Ensure the hook reads the initial `document.fullscreenElement` value on mount
	it("reflects initial document.fullscreenElement state", () => {
		const restore = overrideFullscreenElement(document.documentElement);

		const { getByTestId } = render(<TestComponent />);
		expect(getByTestId("is").textContent).toBe("true");

		cleanup();
		restore();
	});

	// Simulate a successful `requestFullscreen` call and verify `isFullScreen` updates
	it("enterFullScreen calls requestFullscreen and updates state", async () => {
		cleanup();
		const restoreMethods = ensureFullscreenMethods();
		// eslint-disable-next-line unicorn/no-null
		const restore = overrideFullscreenElement(null);

		const reqSpy = vi
			.spyOn(document.documentElement, "requestFullscreen")
			.mockImplementation((): Promise<void> => {
				// simulate native behavior: set fullscreenElement and emit event
				Object.defineProperty(document, "fullscreenElement", {
					configurable: true,
					get: () => document.documentElement,
				});
				document.dispatchEvent(new Event("fullscreenchange"));
				return Promise.resolve();
			});

		const { getByTestId } = render(<TestComponent />);

		fireEvent.click(getByTestId("enter"));

		await waitFor(() => {
			expect(getByTestId("is").textContent).toBe("true");
		});
		expect(reqSpy).toHaveBeenCalledTimes(CALLED_ONCE);

		cleanup();
		restore();
		restoreMethods();
		vi.restoreAllMocks();
	});

	// Simulate `exitFullscreen` behavior and verify `isFullScreen` updates to false
	it("exitFullScreen calls exitFullscreen and updates state", async () => {
		// start in fullscreen
		const restoreMethods = ensureFullscreenMethods();
		const restore = overrideFullscreenElement(document.documentElement);

		const exitSpy = vi.spyOn(document, "exitFullscreen").mockImplementation((): Promise<void> => {
			Object.defineProperty(document, "fullscreenElement", {
				configurable: true,
				// eslint-disable-next-line unicorn/no-null
				value: null,
				writable: true,
			});
			document.dispatchEvent(new Event("fullscreenchange"));
			return Promise.resolve();
		});

		const { getByTestId } = render(<TestComponent />);

		fireEvent.click(getByTestId("exit"));

		await waitFor(() => {
			expect(getByTestId("is").textContent).toBe("false");
		});
		expect(exitSpy).toHaveBeenCalledTimes(CALLED_ONCE);

		cleanup();
		restore();
		restoreMethods();
		vi.restoreAllMocks();
	});

	// Toggle should call enter or exit depending on current fullscreen state
	it("toggleFullScreen calls the appropriate method based on current state", async () => {
		cleanup();
		const restoreMethods = ensureFullscreenMethods();
		// eslint-disable-next-line unicorn/no-null
		const restore = overrideFullscreenElement(null);

		const reqSpy = vi
			.spyOn(document.documentElement, "requestFullscreen")
			.mockImplementation((): Promise<void> => {
				Object.defineProperty(document, "fullscreenElement", {
					configurable: true,
					get: () => document.documentElement,
				});
				document.dispatchEvent(new Event("fullscreenchange"));
				return Promise.resolve();
			});

		const { getByTestId } = render(<TestComponent />);

		// toggle to enter
		fireEvent.click(getByTestId("toggle"));
		await waitFor(() => {
			expect(getByTestId("is").textContent).toBe("true");
		});
		expect(reqSpy).toHaveBeenCalledTimes(CALLED_ONCE);

		// mock exit
		const exitSpy = vi.spyOn(document, "exitFullscreen").mockImplementation((): Promise<void> => {
			Object.defineProperty(document, "fullscreenElement", {
				configurable: true,
				// eslint-disable-next-line unicorn/no-null
				value: null,
				writable: true,
			});
			document.dispatchEvent(new Event("fullscreenchange"));
			return Promise.resolve();
		});

		// toggle to exit
		fireEvent.click(getByTestId("toggle"));
		await waitFor(() => {
			expect(getByTestId("is").textContent).toBe("false");
		});
		expect(exitSpy).toHaveBeenCalledTimes(CALLED_ONCE);

		cleanup();
		restore();
		restoreMethods();
		vi.restoreAllMocks();
	});

	// The hook must add a `fullscreenchange` listener on mount and remove it on unmount
	it("adds and removes fullscreenchange listener on mount/unmount", () => {
		const addSpy = vi.spyOn(document, "addEventListener");
		const removeSpy = vi.spyOn(document, "removeEventListener");

		render(<TestComponent />);
		expect(addSpy).toHaveBeenCalledWith("fullscreenchange", expect.any(Function));

		cleanup();

		// After cleanup the listener should be removed
		expect(removeSpy).toHaveBeenCalledWith("fullscreenchange", expect.any(Function));

		vi.restoreAllMocks();
	});
});
