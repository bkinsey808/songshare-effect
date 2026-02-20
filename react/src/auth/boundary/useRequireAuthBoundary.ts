import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useEnsureSignedIn from "@/react/auth/ensure-signed-in/useEnsureSignedIn";
import handleJustSignedIn from "@/react/auth/handleJustSignedIn";
import { justSignedInQueryParam } from "@/shared/queryParams";

/**
 * Hook that encapsulates the logic for the RequireAuthBoundary component.
 * Handles OAuth callback flows, auth state initialization, and redirect decisions.
 *
 * @returns An object with rendering decisions and state.
 */
export default function useRequireAuthBoundary(): {
	readonly isSignedIn: boolean | undefined;
	readonly justSignedIn: boolean;
} {
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

	// Handle OAuth callback redirect by refreshing session and cleaning up query params
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

	const isSignedIn = useAppStore((state) => state.isSignedIn);

	return {
		isSignedIn,
		justSignedIn,
	};
}
