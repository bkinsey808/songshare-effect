import { useTranslation } from "react-i18next";

import { useAppStore } from "@/react/zustand/useAppStore";
import { SupportedLanguage } from "@/shared/language/supportedLanguages";
// Avoid runtime react-router hooks in this component to prevent runtime
// errors in some dev toolchains. Use window.location as a robust fallback.

function DashboardPage(): ReactElement {
	const { t } = useTranslation();

	const store = useAppStore();
	const isSignedIn = store((state) => state.isSignedIn);
	const user = store((state) => state.userSessionData);
	const signOut = store((state) => state.signOut);
	// Derive current language from the path as a robust fallback
	const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
	const maybeLang = pathname.split("/")[1];
	const currentLang = maybeLang && maybeLang.length > 0 ? maybeLang : SupportedLanguage.en;

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
			<div className="mt-4">
				<button
					className="px-3 py-1 rounded bg-red-600 text-white"
					onClick={async () => {
						// Attempt sign-out on the server; do not rely on it for client-side
						// state cleanup. Log any error but always clear client state.
						try {
							await fetch(`/api/auth/signout`, { method: "POST", credentials: "include" });
						} catch (e) {
							console.error("Sign-out API failed:", e);
						}
						// Always clear client state and navigate home
						signOut();
						// Use a hard navigation to the localized root instead of react-router's
						// navigate() to avoid relying on runtime hooks here.
						window.location.assign(`/${currentLang}`);
					}}
				>
					{t("pages.dashboard.signOut")}
				</button>
			</div>
		</div>
	);
}

export default DashboardPage;
