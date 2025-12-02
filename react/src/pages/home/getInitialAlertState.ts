import { type AlertState } from "@/react/pages/home/alertState";
import {
	displayedKey,
	justDeletedAccountKey,
	justSignedOutKey,
	typeKey,
} from "@/shared/sessionStorageKeys";

export default function getInitialAlertState(): AlertState {
	try {
		const alreadyDisplayed = sessionStorage.getItem(displayedKey);
		if (alreadyDisplayed === "1") {
			const storedType = sessionStorage.getItem(typeKey);
			if (storedType !== null && storedType !== "") {
				return { visible: true, type: storedType };
			}
			return { visible: false, type: "" };
		}

		const justDeletedAccount = sessionStorage.getItem(justDeletedAccountKey);
		const justSignedOut = sessionStorage.getItem(justSignedOutKey);

		let foundType = "";
		if (justDeletedAccount === "1") {
			foundType = "deleteSuccess";
		}
		if (justSignedOut === "1") {
			foundType = "signOutSuccess";
		}

		if (foundType !== "") {
			sessionStorage.setItem(displayedKey, "1");
			sessionStorage.setItem(typeKey, foundType);
			sessionStorage.removeItem(justDeletedAccountKey);
			sessionStorage.removeItem(justSignedOutKey);
			return { visible: true, type: foundType };
		}
	} catch (error) {
		// swallow storage errors and default to no alert
		console.error("Error reading sessionStorage in getInitialAlertState:", error);
	}

	return { visible: false, type: "" };
}
