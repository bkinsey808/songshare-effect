import { useState } from "react";

import type { AlertState } from "@/react/pages/home/alertState";

import getInitialAlertState from "@/react/pages/home/getInitialAlertState";

export default function useHomePage(): {
	alertState: AlertState;
	dismissAlert: () => void;
} {
	const [alertState, setAlertState] =
		useState<AlertState>(getInitialAlertState);

	function dismissAlert(): void {
		setAlertState({ visible: false, type: "" });
		try {
			sessionStorage.removeItem("alertDisplayed");
			sessionStorage.removeItem("alertType");
			sessionStorage.removeItem("justDeletedAccount");
			sessionStorage.removeItem("justSignedOut");
		} catch {
			// ignore storage errors
		}
	}

	return { alertState, dismissAlert };
}
