import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/react/App";
// Removed unused imports after moving hide style logic to React
import "@/react/i18n/i18n";
import "@/react/index.css";

// The root will be unhidden by React after hydration and auth checks (see HydratedLayout)

// In dev runs we can get a lot of noisy console output from the Vite HMR client,
// react-dom internals and other libraries. Provide a simple, opt-in suppression
// so Playwright/dev test runs are quieter by default. Set VITE_CLIENT_DEBUG to
// "1" or "true" to keep the original console.debug/timeStamp behavior.
if (
	import.meta.env.DEV &&
	!(
		import.meta.env["VITE_CLIENT_DEBUG"] === "1" ||
		import.meta.env["VITE_CLIENT_DEBUG"] === "true"
	)
) {
	// dynamically import a small module that silences debug/timeStamp.
	// Keep the actual console mutations in a dedicated file so we can
	// isolate eslint overrides there.
	void import("./quiet-client");
}

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
