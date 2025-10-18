import { useTranslation } from "react-i18next";

import useEnsureSignedIn from "@/react/auth/useEnsureSignedIn";
import { useAppStore } from "@/react/zustand/useAppStore";

function DashboardPage(): React.ReactElement {
	const { t } = useTranslation();

	// Initialization handled by ProtectedLayout (keeps this page simple)
	useEnsureSignedIn();

	const store = useAppStore();
	const isSignedIn = store((state) => state.isSignedIn);
	const user = store((state) => state.userSessionData);

	if (isSignedIn === undefined) {
		// still initializing; the app layout uses Suspense for hydration, but
		// the auth hook may still be in-flight. Render a simple placeholder.
		return (
			<div className="flex items-center justify-center">
				<span className="text-gray-400">{t("pages.dashboard.loading")}</span>
			</div>
		);
	}

	if (!isSignedIn) {
		return (
			<div className="text-center text-gray-300">
				<h2 className="text-2xl font-bold">
					{t("pages.dashboard.signedOutTitle")}
				</h2>
				<p className="mt-2">{t("pages.dashboard.signedOutBody")}</p>
			</div>
		);
	}

	return (
		<div>
			<h2 className="mb-4 text-3xl font-bold">{t("pages.dashboard.title")}</h2>
			<p className="text-gray-300">
				{t("pages.dashboard.welcome", { name: user?.user?.name ?? "" })}
			</p>
			{/* Add dashboard content here */}
		</div>
	);
}

export default DashboardPage;
