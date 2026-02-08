import { useState, type ReactElement } from "react";
import { Navigate } from "react-router-dom";

import useSignIn from "@/react/auth/useSignIn";
import DismissibleAlert from "@/react/lib/design-system/dismissible-alert/DismissibleAlert";
import useLocale from "@/react/lib/language/locale/useLocale";
import { DELETE_SUCCESS } from "@/react/pages/home/alert-keys";
import getInitialAlertState from "@/react/pages/home/getInitialAlertState";
import { dashboardPath } from "@/shared/paths";
import {
	displayedKey,
	justDeletedAccountKey,
	justSignedOutKey,
	typeKey,
} from "@/shared/sessionStorageKeys";

import Home from "./Home";

/**
 * Public landing page that surfaces sign-in options, feature demos, and
 * transient success alerts (e.g., after account deletion or sign-out).
 *
 * @returns - A React element for the localized home page content.
 */
export default function HomePage(): ReactElement {
	const { lang, t } = useLocale();
	const { isSignedIn } = useSignIn();

	const [alertState, setAlertState] = useState(getInitialAlertState);

	if (isSignedIn === true) {
		return <Navigate to={`/${lang}/${dashboardPath}`} replace />;
	}

	return (
		<div>
			<DismissibleAlert
				visible={alertState.visible}
				onDismiss={() => {
					// Clear persisted/session flags when the user dismisses the alert
					setAlertState({ visible: false });
					sessionStorage.removeItem(displayedKey);
					sessionStorage.removeItem(typeKey);
					sessionStorage.removeItem(justDeletedAccountKey);
					sessionStorage.removeItem(justSignedOutKey);
				}}
				title={
					alertState.type === DELETE_SUCCESS
						? t("pages.dashboard.accountDeleted.title")
						: t("pages.dashboard.signedOutSuccess.title")
				}
				variant="success"
				alertType={alertState.type}
			>
				{alertState.type === DELETE_SUCCESS
					? t("pages.dashboard.accountDeleted.message")
					: t("pages.dashboard.signedOutSuccess.message")}
			</DismissibleAlert>

			<Home />
		</div>
	);
}
