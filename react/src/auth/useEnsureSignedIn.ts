// Prefer per-line console exceptions
import { useEffect } from "react";

import ensureSignedIn from "@/react/auth/ensureSignedIn";
import { clientDebug } from "@/react/utils/clientLogger";

/**
 * Hook to ensure the user is signed in on mount.
 *
 * @returns void
 */
export default function useEnsureSignedIn(options?: { readonly force?: boolean }): void {
	const force = options?.force ?? false;

	useEffect(() => {
		// Localized debug-only log
		clientDebug("[useEnsureSignedIn] effect mounted, force=", force);
		void ensureSignedIn({ force });
		// Only run once on mount or when force option changes
	}, [force]);
}
