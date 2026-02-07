import { useState } from "react";

import { type AlertState } from "@/react/pages/home/AlertState.type";
import getInitialAlertState from "@/react/pages/home/getInitialAlertState";

/**
 * Hook that manages the home page alert UI state.
 *
 * - Encapsulates alert visibility and type state.
 * - Provides a helper to dismiss the alert and clear related session flags.
 *
 * @returns alertState - current alert UI state
 * @returns dismissAlert - helper to hide alert and clear session flags
 */
export default function useHomePage(): {
	alertState: AlertState;
	dismissAlert: () => void;
} {
	/** Alert UI state for the home page. Initialized from `getInitialAlertState`. */
	const [alertState, setAlertState] = useState<AlertState>(getInitialAlertState);

	/**
	 * Hide the alert and clear any sessionStorage flags related to alerts and auth transitions.
	 *
	 * Storage operations are best-effort; failures are swallowed so the UI is not disrupted
	 * when `sessionStorage` is unavailable (e.g., certain test environments or privacy modes).
	 */
	function dismissAlert(): void {
		setAlertState({ visible: false, type: "" });
		try {
			sessionStorage.removeItem("alertDisplayed");
			sessionStorage.removeItem("alertType");
			sessionStorage.removeItem("justDeletedAccount");
			sessionStorage.removeItem("justSignedOut");
		} catch {
			// Swallow errors from sessionStorage to avoid throwing in environments without storage access.
		}
	}

	return { alertState, dismissAlert };
}
