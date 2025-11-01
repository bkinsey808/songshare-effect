/* eslint-disable @typescript-eslint/no-explicit-any */
// Small module that silences console.debug and console.timeStamp in dev.
// This file intentionally uses eslint disables so main.tsx stays clean.

const win = window as Window & { __origConsoleDebug?: typeof console.debug };
try {
	win.__origConsoleDebug = (console as Console).debug?.bind(console);

	// silence debug-level logs
	(console as any)["debug"] = () => {
		/* no-op */
	};

	if (typeof (console as any)["timeStamp"] === "function") {
		(console as any)["timeStamp"] = () => {
			/* no-op */
		};
	}
} catch {
	// ignore errors during bootstrap
}

export {};
