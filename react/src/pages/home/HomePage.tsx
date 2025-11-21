import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";

import { SignInButtons } from "@/react/auth/SignInButtons";
import useSignIn from "@/react/auth/useSignIn";
import DismissibleAlert from "@/react/design-system/dismissible-alert/DismissibleAlert";
import type { SupportedLanguageType } from "@/shared/language/supported-languages";
import {
	dashboardPath,
	reactFeaturesPath,
	uploadDemoPath,
} from "@/shared/paths";
import {
	justDeletedAccountKey,
	justSignedOutKey,
} from "@/shared/sessionStorageKeys";

export default function HomePage(): ReactElement {
	const { t, i18n } = useTranslation();
	const currentLang = i18n.language as SupportedLanguageType;
	const { isSignedIn } = useSignIn();

	// Use VITE_APP_NAME from env if available, fall back to the app title translation
	const appNameEnv = import.meta.env["VITE_APP_NAME"] as string | undefined;
	const appName = appNameEnv ?? (t("app.title") as string) ?? "SongShare";

	// Read paragraphs array from translations. We pass appName so the translations can
	// interpolate the application name ({{appName}}).
	const homeParagraphs = t("pages.home.paragraphs", {
		returnObjects: true,
		appName,
	});

	// Initializer reads sessionStorage synchronously on first render (SPA only)
	function getInitialAlertState(): {
		visible: boolean;
		type: string;
	} {
		const displayedKey = "alertDisplayed";
		const typeKey = "alertType";

		try {
			// If we've already displayed an alert for this navigation, return it.
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

			// Otherwise, check the transient flags set by the sign-out / delete flows.
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
				// Persist marker immediately so StrictMode remounts rehydrate the same
				// UI. Also clear the transient flags.
				sessionStorage.setItem(displayedKey, "1");
				sessionStorage.setItem(typeKey, foundType);
				sessionStorage.removeItem(justDeletedAccountKey);
				sessionStorage.removeItem(justSignedOutKey);
				return { visible: true, type: foundType };
			}
		} catch (error) {
			console.error(
				"Error reading sessionStorage in getInitialAlertState:",
				error,
			);
		}

		return { visible: false, type: "" };
	}

	const [alertState, setAlertState] = useState(getInitialAlertState);

	if (isSignedIn === true) {
		return <Navigate to={`/${currentLang}/${dashboardPath}`} replace />;
	}

	return (
		<div>
			<DismissibleAlert
				visible={alertState.visible}
				onDismiss={() => {
					// Clear persisted/session flags when the user dismisses the alert
					setAlertState({ visible: false, type: "" });
					sessionStorage.removeItem("alertDisplayed");
					sessionStorage.removeItem("alertType");
					sessionStorage.removeItem("justDeletedAccount");
					sessionStorage.removeItem("justSignedOut");
				}}
				title={
					alertState.type === "deleteSuccess"
						? t("pages.dashboard.accountDeleted.title")
						: t("pages.dashboard.signedOutSuccess.title")
				}
				children={
					alertState.type === "deleteSuccess"
						? t("pages.dashboard.accountDeleted.message")
						: t("pages.dashboard.signedOutSuccess.message")
				}
				variant="success"
				alertType={alertState.type}
			/>

			<div className="mb-10 text-center">
				<h2 className="mb-4 text-3xl font-bold">🏠 {t("pages.home.title")}</h2>
				<p className="text-gray-400">{t("pages.home.subtitle")}</p>
			</div>
			<SignInButtons />

			{/* Render translated paragraph array (pages.home.paragraphs) */}
			<div className="mx-auto mt-8 max-w-3xl space-y-4 text-left">
				{Array.isArray(homeParagraphs) &&
					homeParagraphs.map((paragraph, idx) => (
						<p key={idx} className="text-gray-300">
							{paragraph}
						</p>
					))}
			</div>
			<div className="my-12 space-y-8">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					<div className="rounded-xl border border-white/10 bg-linear-to-br from-blue-500/10 to-purple-500/10 p-8 text-center">
						<div className="mb-6 text-6xl">🚀</div>
						<h3 className="mb-4 text-2xl font-bold">React Features Demo</h3>
						<p className="mb-6 text-gray-300">
							Explore interactive demonstrations of modern React features
							including Suspense, the new 'use' hook, performance optimizations,
							and more
						</p>
						<Link
							to={`/${currentLang}/${reactFeaturesPath}`}
							className="inline-block cursor-pointer rounded-lg border-none bg-linear-to-r from-blue-500 to-purple-500 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:from-blue-600 hover:to-purple-600 hover:shadow-lg"
						>
							Explore React Features
						</Link>
					</div>

					<div className="rounded-xl border border-white/10 bg-linear-to-br from-green-500/10 to-teal-500/10 p-8 text-center">
						<div className="mb-6 text-6xl">📤</div>
						<h3 className="mb-4 text-2xl font-bold">Upload Demo</h3>
						<p className="mb-6 text-gray-300">
							Experience file upload functionality with progress tracking, error
							handling, and real-time feedback
						</p>
						<Link
							to={`/${currentLang}/${uploadDemoPath}`}
							className="inline-block cursor-pointer rounded-lg border-none bg-linear-to-r from-green-500 to-teal-500 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:from-green-600 hover:to-teal-600 hover:shadow-lg"
						>
							Try Upload Demo
						</Link>
					</div>
				</div>

				<div className="mt-12 rounded-lg border border-blue-500/20 bg-blue-500/10 p-6 text-center">
					<h4 className="mb-3 text-lg font-semibold text-blue-300">
						💡 What's Inside
					</h4>
					<p className="text-sm text-blue-200">
						Discover cutting-edge React patterns, performance optimization
						techniques, and modern development practices through hands-on
						examples
					</p>
				</div>
			</div>
		</div>
	);
}
