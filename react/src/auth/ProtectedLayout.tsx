import { useEffect } from "react";
import {
	Navigate,
	Outlet,
	useNavigate,
	useParams,
	useSearchParams,
} from "react-router-dom";

import useEnsureSignedIn, {
	ensureSignedIn,
} from "@/react/auth/useEnsureSignedIn";
import { useAppStore } from "@/react/zustand/useAppStore";
import { defaultLanguage } from "@/shared/language/supportedLanguages";
// (no direct api path required here)
import { SigninErrorToken } from "@/shared/signinTokens";

// Layout that protects child routes and redirects unauthenticated users.
export default function ProtectedLayout(): ReactElement {
	// Detect whether we were redirected here from the OAuth callback.
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const justSignedIn = searchParams.get("justSignedIn") === "1";

	// Ensure auth is initialized. For the OAuth redirect case we'll trigger
	// a forced check inside the effect below so we can remove the query
	// param after verifying the session. This avoids passing runtime
	// 'force' into the hook and keeps hook call order stable.
	useEnsureSignedIn();

	// Make a stable string representation of the search params so we can
	// safely use it in hook dependency arrays without relying on object
	// identity.
	const searchParamsString = searchParams.toString();

	useEffect(() => {
		if (!justSignedIn) {
			return;
		}

		const controller = new AbortController();
		const next = new URLSearchParams(searchParamsString);
		next.delete("justSignedIn");

		// Always use the proxied API path so Vite's dev proxy handles requests
		// to the API during local development (keeps frontend on :5173).
		// Use the proxied API path directly via apiMePath

		// For the OAuth redirect case, force a fresh `/api/me` check so the
		// client can see the HttpOnly cookie set by the server and update
		// the Zustand store. After the check we remove the `justSignedIn`
		// param from the URL and navigate with replace.
		void (async () => {
			try {
				// Force-refresh the session and update the store.
				await ensureSignedIn({ force: true });
			} catch (err) {
				const isAbort =
					typeof err === "object" &&
					err !== null &&
					"name" in err &&
					(err as { name?: unknown }).name === "AbortError";
				if (!isAbort) {
					console.error(`[ProtectedLayout] ensureSignedIn failed`, err);
					// If the check fails we conservatively set a server error
					// token so the UI can show an appropriate message.
					next.set("signinError", SigninErrorToken.serverError);
				}
			}

			// Cleanup the query param and navigate.
			setSearchParams(next, { replace: true });
			void navigate(
				window.location.pathname +
					(next.toString() ? `?${next.toString()}` : ""),
				{ replace: true },
			);
		})();

		return () => {
			controller.abort();
		};
	}, [justSignedIn, navigate, searchParamsString, setSearchParams]);

	const store = useAppStore();
	const isSignedIn = store((state) => state.isSignedIn);
	const { lang = defaultLanguage } = useParams();

	// Still initializing — render nothing (parent Suspense handles hydration)
	if (isSignedIn === undefined) {
		return <div />;
	}

	if (isSignedIn === false) {
		// Redirect to language-prefixed home (you can change target as needed)
		return <Navigate to={`/${lang}`} replace />;
	}

	// Signed in — render nested routes
	return <Outlet />;
}
