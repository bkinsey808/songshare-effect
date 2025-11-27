/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unnecessary-type-assertion, no-console */
// Small module that silences console.debug and console.timeStamp in dev.
// This file intentionally uses eslint disables so main.tsx stays clean.

const win = window as Window & { __origConsoleDebug?: typeof console.debug };
try {
	// Save original debug if present
	win.__origConsoleDebug = console.debug?.bind(console);

	// silence debug-level logs
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(console as any)["debug"] = () => {
		/* no-op */
	};

	// silence timeStamp if present
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	if (typeof (console as any)["timeStamp"] === "function") {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(console as any)["timeStamp"] = () => {
			/* no-op */
		};
	}
} catch {
	// ignore errors during bootstrap
}

export {};
