import { Navigate, Outlet } from "react-router-dom";

import useRequireAuthBoundary from "@/react/auth/boundary/useRequireAuthBoundary";
import useCurrentLang from "@/react/language/useCurrentLang";
import buildPathWithLang from "@/shared/language/buildPathWithLang";

/**
 * RequireAuthBoundary
 *
 * Top-level boundary component used for routes that require an authenticated session.
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
 *   handled via sessionStorage and consumed by the Home page; this boundary intentionally
 *   does not remove those keys.
 *
 * @returns ReactElement — either an <Outlet /> for nested routes, a placeholder
 *   <div /> while checking auth, or a <Navigate /> to the localized home when appropriate.
 */
export default function RequireAuthBoundary(): ReactElement {
	const { isSignedIn, justSignedIn } = useRequireAuthBoundary();
	const lang = useCurrentLang();

	if (isSignedIn === undefined) {
		return <div />;
	}

	// If the user is explicitly coming from the OAuth redirect flow
	// (we carry `justSignedIn=1` in the query), avoid immediately
	// redirecting to home while the `ensureSignedIn` effect is still
	// verifying the session. Return a neutral placeholder so the
	// effect can complete and update the store.
	if (!isSignedIn) {
		if (justSignedIn) {
			return <div />;
		}

		// Redirect to language-prefixed home (you can change target as needed)

		{
			const langForNav = lang;
			return <Navigate to={buildPathWithLang("/", langForNav)} replace />;
		}
	}

	// Signed in — render nested routes
	return <Outlet />;
}
