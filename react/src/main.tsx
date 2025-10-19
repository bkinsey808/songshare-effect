import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/react/App";
import { isSigninPending, removeHideStyle } from "@/react/auth/signinPending";
import "@/react/i18n";
import "@/react/index.css";

// Synchronously decide whether to unhide the app root. We hide the root by
// default in index.html to avoid a flash; remove that hiding now only when we
// detect there is NOT a sign-in in progress.
try {
	const styleEl = document.getElementById("songshare-signin-hide");
	let url: URL | undefined;
	if (typeof window !== "undefined") {
		url = new URL(window.location.href);
	}
	const urlHasJustSignedIn =
		url !== undefined && url.searchParams.get("justSignedIn") === "1";

	// Use centralized helper to detect pending state
	const signinPending = isSigninPending();

	// Unhide only when not pending and not a callback arrival.
	if (!signinPending && !urlHasJustSignedIn && styleEl) {
		removeHideStyle();
	}
} catch {
	// ignore errors during initial boot checks
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
