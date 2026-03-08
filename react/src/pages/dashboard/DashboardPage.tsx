import { useTranslation } from "react-i18next";

import useHydration from "@/react/app/useHydration";
import PendingInvitationsSection from "@/react/invitation/pending-invitation-section/PendingInvitationsSection";
import useInvitationSubscription from "@/react/invitation/subscribe/useInvitationSubscription";
import DismissibleAlert from "@/react/lib/design-system/dismissible-alert/DismissibleAlert";
import {
	REGISTERED_SUCCESS,
	SIGNED_IN_SUCCESS,
	UNAUTHORIZED_ACCESS,
} from "@/react/pages/home/alert-keys";
import SharedItemsSection from "@/react/share/shared-item-section/SharedItemsSection";

import SongManagementSection from "./SongManagementSection";
import useDashboard from "./useDashboard";

/**
 * Dashboard page — local UI for the signed-in user's account and songs.
 *
 * @returns The dashboard page element.
 */
function DashboardPage(): ReactElement {
	// Use hydration hook to get hydration state.
	const { isHydrated } = useHydration();

	// Disable react-i18next suspense here to avoid suspending during render.
	const { t } = useTranslation(undefined, { useSuspense: false });

	const {
		localIsSignedIn,
		localUser,
		showSignedInAlert,
		showRegisteredAlert,
		showUnauthorizedAlert,
		setShowSignedInAlert,
		setShowRegisteredAlert,
		setShowUnauthorizedAlert,
	} = useDashboard();

	// Set up invitation subscriptions and initial fetch
	useInvitationSubscription();

	// If we haven't finished hydration, render a neutral placeholder to
	// ensure hook order remains stable and avoid hydration mismatches.
	if (!isHydrated) {
		return <div />;
	}

	if (localIsSignedIn === false) {
		return (
			<div className="text-center text-gray-300">
				<h2 className="text-2xl font-bold">{t("pages.dashboard.signedOutTitle")}</h2>
				<p className="mt-2">{t("pages.dashboard.signedOutBody")}</p>
			</div>
		);
	}

	return (
		<div>
			{/* One-time success alerts after signing in or registering */}
			<DismissibleAlert
				visible={Boolean(showSignedInAlert || showRegisteredAlert)}
				onDismiss={() => {
					setShowSignedInAlert(false);
					setShowRegisteredAlert(false);
				}}
				variant="success"
				alertType={showRegisteredAlert ? REGISTERED_SUCCESS : SIGNED_IN_SUCCESS}
			>
				{showRegisteredAlert
					? t("pages.dashboard.createdAccountSuccess", "You have successfully created an account.")
					: t("pages.dashboard.signedInSuccess", "You have successfully signed in.")}
			</DismissibleAlert>

			{/* Unauthorized access alert */}
			<DismissibleAlert
				visible={showUnauthorizedAlert}
				onDismiss={() => {
					setShowUnauthorizedAlert(false);
				}}
				variant="error"
				alertType={UNAUTHORIZED_ACCESS}
			>
				{t("pages.dashboard.unauthorizedAccess", "You do not have permission to access that song.")}
			</DismissibleAlert>

			<h2 className="mb-4 text-3xl font-bold">{t("pages.dashboard.title")}</h2>
			<p className="text-gray-300">
				{t("pages.dashboard.welcome", { name: localUser?.user?.name ?? "" })}
			</p>

			<PendingInvitationsSection />

			<SharedItemsSection />

			<SongManagementSection />
		</div>
	);
}

export default DashboardPage;
