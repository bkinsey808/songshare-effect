import { useEffect } from "react";
import {
	Navigate,
	Outlet,
	useNavigate,
	useParams,
	useSearchParams,
} from "react-router-dom";

import handleJustSignedIn from "@/react/auth/handleJustSignedIn";
import useEnsureSignedIn from "@/react/auth/useEnsureSignedIn";
import { useAppStore } from "@/react/zustand/useAppStore";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { justSignedInQueryParam } from "@/shared/queryParams";

/**
 * ProtectedLayout
 *
 * Top-level layout component used for routes that require an authenticated session.
 * Responsibilities:
 * - Ensure auth state is initialized (via `useEnsureSignedIn`).
 * - Detect the OAuth callback flow (presence of `justSignedIn=1` in the query string)
 *   and delegate to `handleJustSignedIn` which refreshes the session and writes a one-time
 *   sessionStorage marker.
 * - When the user is unauthenticated, decide whether to render a neutral placeholder
 *   (while the OAuth redirect handling completes), allow navigation to continue to
 *   child routes, or redirect to the localized home page.
 *
 * Notes:
 * - `justSignedIn` is read from the query params and handled specially to avoid
 *   hydration/timing races during OAuth redirects.
 * - Other one-time signals such as `justSignedOut` and `justDeletedAccount` are
 *   handled via sessionStorage and consumed by the Home page; this layout intentionally
 *   does not remove those keys.
 *
 * @returns ReactElement — either an <Outlet /> for nested routes, a placeholder
 *   <div /> while checking auth, or a <Navigate /> to the localized home when appropriate.
 */
export default function ProtectedLayout(): ReactElement {
	// Detect whether we were redirected here from the OAuth callback.
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const justSignedIn = searchParams.get(justSignedInQueryParam) === "1";

	// Ensure auth is initialized. For the OAuth redirect case we'll trigger
	// a forced check inside the effect below so we can remove the query
	// param after verifying the session. This avoids passing runtime
	// 'force' into the hook and keeps hook call order stable.
	useEnsureSignedIn();

	// Make a stable string representation of the search params so we can
	// safely use it in hook dependency arrays without relying on object
	// identity.
	const searchParamsString = searchParams.toString();

	// Keep using the app store for auth state (isSignedIn) but the
	// transient just-signed-in signal is handled via sessionStorage.

	useEffect(() => {
		if (!justSignedIn) {
			return;
		}

		const next = new URLSearchParams(searchParamsString);
		next.delete(justSignedInQueryParam);

		// Delegate the OAuth redirect handling to the extracted helper which
		// performs the forced `/api/me` refresh, writes the one-time
		// sessionStorage marker, and navigates with replace.
		void handleJustSignedIn({ next, setSearchParams, navigate });
	}, [justSignedIn, navigate, searchParamsString, setSearchParams]);

	const store = useAppStore();
	const isSignedIn = store((state) => state.isSignedIn);
	const { lang = defaultLanguage } = useParams();

	// Still initializing — render nothing (parent Suspense handles hydration)
	if (isSignedIn === undefined) {
		return <div />;
	}

	// If the user is explicitly coming from the OAuth redirect flow
	// (we carry `justSignedIn=1` in the query), avoid immediately
	// redirecting to home while the `ensureSignedIn` effect is still
	// verifying the session. Return a neutral placeholder so the
	// effect can complete and update the store.
	if (isSignedIn === false) {
		if (justSignedIn) {
			return <div />;
		}

		// Redirect to language-prefixed home (you can change target as needed)
		return <Navigate to={`/${lang}`} replace />;
	}

	// Signed in — render nested routes
	return <Outlet />;
}
