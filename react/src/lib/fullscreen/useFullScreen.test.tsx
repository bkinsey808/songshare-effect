import type { ReactElement } from "react";

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useFullScreen from "@/react/lib/fullscreen/useFullScreen";
import asNull from "@/react/lib/test-utils/asNull";
import asyncNoop from "@/react/lib/test-utils/asyncNoop";
import forceCast from "@/react/lib/test-utils/forceCast";

const CALLED_ONCE = 1;

type FullscreenElement = {
	requestFullscreen?: () => Promise<void>;
} & HTMLElement;

type FullscreenDocument = {
	exitFullscreen?: () => Promise<void>;
} & Document;

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
		forceCast<FullscreenElement>(document.documentElement).requestFullscreen = asyncNoop;
	}
	if (!hadExit) {
		forceCast<FullscreenDocument>(document).exitFullscreen = asyncNoop;
	}
	return (): void => {
		if (!hadReq) {
			// use forceCast to a partial type to allow deleting/setting to undefined
			delete forceCast<Partial<FullscreenElement>>(document.documentElement).requestFullscreen;
		}
		if (!hadExit) {
			delete forceCast<Partial<FullscreenDocument>>(document).exitFullscreen;
		}
	};
}

function TestComponent(): ReactElement {
	const { isFullScreen, toggleFullScreen, enterFullScreen, exitFullScreen } = useFullScreen();

	return (
		<div>
			<div data-testid="is">{String(isFullScreen)}</div>
			<button data-testid="toggle" onClick={toggleFullScreen} type="button">
				Toggle
			</button>
			<button
				data-testid="enter"
				onClick={() => {
					void enterFullScreen();
				}}
				type="button"
			>
				Enter
			</button>
			<button
				data-testid="exit"
				onClick={() => {
					void exitFullScreen();
				}}
				type="button"
			>
				Exit
			</button>
		</div>
	);
}

/**
 * Helper to define `fullscreenElement` on `document` since it's read-only.
 * Returns a restore function.
 */
function overrideFullscreenElement(el: Element | null): () => void {
	const original = Object.getOwnPropertyDescriptor(document, "fullscreenElement");
	Object.defineProperty(document, "fullscreenElement", {
		configurable: true,
		get: () => el,
	});
	return () => {
		if (original) {
			Object.defineProperty(document, "fullscreenElement", original);
		} else {
			Object.defineProperty(document, "fullscreenElement", {
				configurable: true,
				value: asNull(),
			});
		}
	};
}

describe("useFullScreen", () => {
	it("initializes with isFullScreen: false", () => {
		const { getByTestId } = render(<TestComponent />);
		expect(getByTestId("is").textContent).toBe("false");
	});

	// Simulate `requestFullscreen` behavior and verify `isFullScreen` updates to true
	it("enterFullScreen calls requestFullscreen and updates state", async () => {
		cleanup();
		const restoreMethods = ensureFullscreenMethods();
		const restore = overrideFullscreenElement(asNull());

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
				value: asNull(),
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
		const restore = overrideFullscreenElement(asNull());

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
				value: asNull(),
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
