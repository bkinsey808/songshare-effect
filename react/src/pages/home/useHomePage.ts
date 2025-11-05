import { useState } from "react";

type AlertState = {
	visible: boolean;
	type: string;
};

function getInitialAlertState(): AlertState {
	const displayedKey = "alertDisplayed";
	const typeKey = "alertType";

	try {
		const alreadyDisplayed = sessionStorage.getItem(displayedKey);
		if (alreadyDisplayed === "1") {
			const storedType = sessionStorage.getItem(typeKey);
			if (storedType !== null) {
				if (storedType !== "") {
					return { visible: true, type: storedType };
				}
			}
			return { visible: false, type: "" };
		}

		const justDeletedAccount = sessionStorage.getItem("justDeletedAccount");
		const justSignedOut = sessionStorage.getItem("justSignedOut");

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
			sessionStorage.removeItem("justDeletedAccount");
			sessionStorage.removeItem("justSignedOut");
			return { visible: true, type: foundType };
		}
	} catch (error) {
		// swallow storage errors and default to no alert
		console.error(
			"Error reading sessionStorage in getInitialAlertState:",
			error,
		);
	}

	return { visible: false, type: "" };
}
export default function useHomePage(): {
	alertState: AlertState;
	dismissAlert: () => void;
} {
	const [alertState, setAlertState] =
		useState<AlertState>(getInitialAlertState);

	const dismissAlert = (): void => {
		setAlertState({ visible: false, type: "" });
		try {
			sessionStorage.removeItem("alertDisplayed");
			sessionStorage.removeItem("alertType");
			sessionStorage.removeItem("justDeletedAccount");
			sessionStorage.removeItem("justSignedOut");
		} catch {
			// ignore storage errors
		}
	};

	return { alertState, dismissAlert };
}
