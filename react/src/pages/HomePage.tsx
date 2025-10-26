import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";

import { SignInButtons } from "@/react/auth/SignInButtons";
import useSignIn from "@/react/auth/useSignIn";
import DismissibleAlert from "@/react/components/DismissibleAlert/DismissibleAlert";
import type { SupportedLanguageType } from "@/shared/language/supportedLanguages";
import {
	dashboardPath,
	reactFeaturesPath,
	uploadDemoPath,
} from "@/shared/paths";

export default function HomePage(): ReactElement {
	const { t, i18n } = useTranslation();
	const currentLang = i18n.language as SupportedLanguageType;

	const { isSignedIn, signinPending, signinError, dismissError } = useSignIn();

	// Synchronously redirect to dashboard when signed in
	if (isSignedIn === true) {
		return <Navigate to={`/${currentLang}/${dashboardPath}`} replace />;
	}

	// If sign-in was initiated (via sessionStorage or cookie) and no signin error is present yet, render
	// a blank page to avoid flashing the homepage content while the app processes the OAuth redirect back from the provider.
	if (signinPending && signinError === undefined) {
		return <div />;
	}

	return (
		<div>
			<DismissibleAlert
				visible={signinError !== undefined}
				onDismiss={dismissError}
				title={signinError === undefined ? undefined : t(signinError)}
				variant="error"
			/>

			<div className="mb-10 text-center">
				<h2 className="mb-4 text-3xl font-bold">🏠 {t("pages.home.title")}</h2>
				<p className="text-gray-400">{t("pages.home.subtitle")}</p>
			</div>
			<SignInButtons />
			<div className="my-12 space-y-8">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					<div className="rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-8 text-center">
						<div className="mb-6 text-6xl">🚀</div>
						<h3 className="mb-4 text-2xl font-bold">React Features Demo</h3>
						<p className="mb-6 text-gray-300">
							Explore interactive demonstrations of modern React features
							including Suspense, the new 'use' hook, performance optimizations,
							and more
						</p>
						<Link
							to={`/${currentLang}/${reactFeaturesPath}`}
							className="inline-block cursor-pointer rounded-lg border-none bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:from-blue-600 hover:to-purple-600 hover:shadow-lg"
						>
							Explore React Features
						</Link>
					</div>

					<div className="rounded-xl border border-white/10 bg-gradient-to-br from-green-500/10 to-teal-500/10 p-8 text-center">
						<div className="mb-6 text-6xl">📤</div>
						<h3 className="mb-4 text-2xl font-bold">Upload Demo</h3>
						<p className="mb-6 text-gray-300">
							Experience file upload functionality with progress tracking, error
							handling, and real-time feedback
						</p>
						<Link
							to={`/${currentLang}/${uploadDemoPath}`}
							className="inline-block cursor-pointer rounded-lg border-none bg-gradient-to-r from-green-500 to-teal-500 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:from-green-600 hover:to-teal-600 hover:shadow-lg"
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
