import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import DismissibleAlert from "@/react/design-system/dismissible-alert/DismissibleAlert";
import { useAppStoreHydrated } from "@/react/zustand/useAppStore";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { dashboardPath, deleteAccountPath } from "@/shared/paths";

import SongManagementSection from "./SongManagementSection";
import useDashboard from "./useDashboard";

/**
 * Dashboard page — local UI for the signed-in user's account and songs.
 *
 * @returns The dashboard page element.
 */
function DashboardPage(): ReactElement {
	// Use hydration-aware app store hook to get hydration state only.
	const { isHydrated } = useAppStoreHydrated();

	// Disable react-i18next suspense here to avoid suspending during render.
	const { t } = useTranslation(undefined, { useSuspense: false });
	const navigate = useNavigate();

	const {
		localIsSignedIn,
		localUser,
		signOut,
		showSignedInAlert,
		showRegisteredAlert,
		setShowSignedInAlert,
		setShowRegisteredAlert,
		currentLang,
	} = useDashboard();

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
				alertType={showRegisteredAlert ? "registeredSuccess" : "signedInSuccess"}
			>
				{showRegisteredAlert
					? t("pages.dashboard.createdAccountSuccess", "You have successfully created an account.")
					: t("pages.dashboard.signedInSuccess", "You have successfully signed in.")}
			</DismissibleAlert>

			<h2 className="mb-4 text-3xl font-bold">{t("pages.dashboard.title")}</h2>
			<p className="text-gray-300">
				{t("pages.dashboard.welcome", { name: localUser?.user?.name ?? "" })}
			</p>

			<SongManagementSection currentLang={currentLang} />

			<div className="mt-4">
				<button
					type="button"
					className="rounded bg-red-600 px-3 py-1 text-white"
					onClick={() => {
						void signOut();
					}}
				>
					{t("pages.dashboard.signOut")}
				</button>

				{/* Delete account navigates to a confirmation page */}
				<button
					type="button"
					className="ml-3 rounded border border-red-600 bg-transparent px-3 py-1 text-red-600 hover:bg-red-50/5"
					onClick={() => {
						{
							const langForNav = isSupportedLanguage(currentLang) ? currentLang : defaultLanguage;
							void navigate(
								buildPathWithLang(`/${dashboardPath}/${deleteAccountPath}`, langForNav),
							);
						}
					}}
				>
					{t("pages.dashboard.deleteAccount", "Delete Account")}
				</button>
			</div>
		</div>
	);
}

export default DashboardPage;
