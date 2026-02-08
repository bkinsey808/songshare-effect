import { useEffect, useState } from "react";

/**
 * Request the browser to enter fullscreen on the document element.
 *
 * We guard by checking `document.fullscreenElement` to avoid redundant requests
 * which can trigger errors or no-ops in some user agents. Some runtimes (like
 * certain jsdom versions) may expose `undefined` instead of `null` when the
 * document is not in fullscreen. Treat both as "not fullscreen" here.
 *
 * @returns Promise<void>
 */
async function enterFullScreen(): Promise<void> {
	if (document.fullscreenElement === null || document.fullscreenElement === undefined) {
		try {
			await document.documentElement.requestFullscreen();
		} catch (error: unknown) {
			console.error("Failed to enter fullscreen:", error);
		}
	}
}

/**
 * Exit browser fullscreen mode if currently active.
 *
 * Checking `document.fullscreenElement` avoids calling `exitFullscreen` when not in
 * fullscreen, which can throw or be a no-op depending on the user agent.
 * Some runtimes may use `undefined` for "no fullscreen" - treat that equivalently
 * to `null`.
 *
 * @returns Promise<void>
 */
async function exitFullScreen(): Promise<void> {
	if (document.fullscreenElement !== null && document.fullscreenElement !== undefined) {
		try {
			await document.exitFullscreen();
		} catch (error: unknown) {
			console.error("Failed to exit fullscreen:", error);
		}
	}
}

/**
 * useFullScreen
 *
 * Hook to manage full screen mode.
 * - Keeps an `isFullScreen` boolean in sync with the document's fullscreen state.
 * - Listens for the browser's `fullscreenchange` event and automatically cleans up the listener.
 * - Relies on the browser's built-in fullscreen behavior (e.g., Esc key exits fullscreen).
 *
 * @returns isFullScreen - true when the document is currently in fullscreen
 * @returns toggleFullScreen - toggles between enter and exit fullscreen
 * @returns enterFullScreen - explicitly request entering fullscreen
 * @returns exitFullScreen - explicitly request exiting fullscreen
 */
export default function useFullScreen(): {
	isFullScreen: boolean;
	toggleFullScreen: () => void;
	enterFullScreen: () => Promise<void>;
	exitFullScreen: () => Promise<void>;
} {
	const [isFullScreen, setIsFullScreen] = useState<boolean>(
		() =>
			// Treat both `null` and `undefined` as not-fullscreen for robustness across
			// various runtimes/test environments.
			document.fullscreenElement !== null && document.fullscreenElement !== undefined,
	);

	useEffect(() => {
		function updateFullScreenState(): void {
			setIsFullScreen(
				document.fullscreenElement !== null && document.fullscreenElement !== undefined,
			);
		}

		// Keep `isFullScreen` in sync with the browser; `fullscreenchange` fires when state changes.
		document.addEventListener("fullscreenchange", updateFullScreenState);
		return (): void => {
			document.removeEventListener("fullscreenchange", updateFullScreenState);
		};
	}, []);

	/**
	 * Toggle fullscreen: enter when not fullscreen, exit when currently fullscreen.
	 */
	function toggleFullScreen(): void {
		if (isFullScreen) {
			void exitFullScreen();
		} else {
			void enterFullScreen();
		}
	}

	return {
		isFullScreen,
		toggleFullScreen,
		enterFullScreen,
		exitFullScreen,
	};
}
