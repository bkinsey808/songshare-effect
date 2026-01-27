import { type AlertState } from "@/react/pages/home/AlertState.type";
import {
	displayedKey,
	justDeletedAccountKey,
	justSignedOutKey,
	typeKey,
} from "@/shared/sessionStorageKeys";

/**
 * getInitialAlertState
 *
 * Read sessionStorage to determine whether an alert should be visible on the
 * homepage on initial render. Prefers an already-displayed sentinel so the
 * same alert is not re-shown; otherwise inspects transient signals set by
 * other flows (e.g., account deletion or sign out). Any storage errors are
 * swallowed to ensure the UI still renders in restricted environments.
 *
 * @returns AlertState - whether an alert should be visible and its type
 */
export default function getInitialAlertState(): AlertState {
	try {
		// If a "displayed" sentinel exists, use the stored type so we don't
		// re-show an alert that was already acknowledged earlier.
		const alreadyDisplayed = sessionStorage.getItem(displayedKey);
		if (alreadyDisplayed === "1") {
			const storedType = sessionStorage.getItem(typeKey);
			// Treat missing or empty storedType as "no alert" for robustness.
			if (storedType !== null && storedType !== "") {
				return { visible: true, type: storedType };
			}
			return { visible: false, type: "" };
		}

		// Check transient flags that indicate an action just occurred.
		const justDeletedAccount = sessionStorage.getItem(justDeletedAccountKey);
		const justSignedOut = sessionStorage.getItem(justSignedOutKey);

		let foundType = "";
		if (justDeletedAccount === "1") {
			foundType = "deleteSuccess";
		}
		// If multiple transient flags exist, the latter one wins. Sign-out
		// intentionally takes precedence over delete in this ordering.
		if (justSignedOut === "1") {
			foundType = "signOutSuccess";
		}

		if (foundType !== "") {
			// Persist a sentinel so the alert is not re-shown on subsequent
			// renders, and clean up the transient signals that triggered it.
			sessionStorage.setItem(displayedKey, "1");
			sessionStorage.setItem(typeKey, foundType);
			sessionStorage.removeItem(justDeletedAccountKey);
			sessionStorage.removeItem(justSignedOutKey);
			return { visible: true, type: foundType };
		}
	} catch (error) {
		// Swallow storage errors and default to no alert so the page still
		// renders in environments where storage is unavailable or blocked.
		console.error("Error reading sessionStorage in getInitialAlertState:", error);
	}

	// No alerts to show by default
	return { visible: false, type: "" };
}
