import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { SignInButtons } from "@/react/auth/SignInButtons";
import { getStoreApi } from "@/react/zustand/useAppStore";
import type { SupportedLanguageType } from "@/shared/language/supportedLanguages";
import {
	dashboardPath,
	reactFeaturesPath,
	uploadDemoPath,
} from "@/shared/paths";
import { SigninErrorToken } from "@/shared/signinTokens";

function HomePage(): ReactElement {
	const { t, i18n } = useTranslation();
	const currentLang = i18n.language as SupportedLanguageType;
	const navigate = useNavigate();
	// Read sign-in state from the store API via subscription instead of
	// calling the Zustand hook here. This keeps the hook call order in
	// this component stable across renders and avoids conditional hook
	// differences that can arise from child components.
	const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(
		() => getStoreApi()?.getState().isSignedIn,
	);

	useEffect(() => {
		const api = getStoreApi();
		if (!api) {
			return;
		}
		// subscribe returns an unsubscribe function
		const unsubscribe = api.subscribe((state) => {
			setIsSignedIn(state.isSignedIn);
		});
		return unsubscribe;
	}, []);
	const [searchParams, setSearchParams] = useSearchParams();
	// We will read the signinError on mount and store it in state. Doing the
	// read-and-cleanup inside an effect lets us avoid disabling ESLint rules
	// and keeps React Compiler optimizations intact.
	const [signinError, setSigninError] = useState<string | null>(null);
	const [dismissed, setDismissed] = useState(false);

	// Run once on mount: capture the param into state and remove it from the
	// URL so it doesn't persist. This uses proper effect dependencies and
	// doesn't disable lint rules.
	useEffect(() => {
		const param = searchParams.get("signinError");
		if (param !== null) {
			setSigninError(param);
			searchParams.delete("signinError");
			searchParams.delete("provider");
			setSearchParams(searchParams, { replace: true });
		}
		// Only run on mount; searchParams and setSearchParams are stable from
		// react-router, but including them is safe and satisfies lint.
	}, [searchParams, setSearchParams]);

	// Redirect to dashboard when signed in
	useEffect(() => {
		if (isSignedIn === true) {
			void navigate(`/${currentLang}/${dashboardPath}`);
		}
	}, [isSignedIn, navigate, currentLang]);

	return (
		<div>
			{signinError !== null && !dismissed ? (
				<div className="mb-6 rounded-md bg-red-600/10 p-4 text-center">
					<div className="mx-auto max-w-3xl">
						<strong className="block text-red-300">
							{signinError === SigninErrorToken.providerMismatch
								? t("errors.signin.providerMismatch")
								: t("errors.signin.unknown")}
						</strong>
						<div className="mt-2">
							<button
								type="button"
								className="rounded px-3 py-1 text-sm text-white/90"
								onClick={() => {
									setDismissed(true);
									// Remove the query param so it doesn't persist on refresh
									searchParams.delete("signinError");
									searchParams.delete("provider");
									setSearchParams(searchParams, { replace: true });
								}}
							>
								{t("actions.dismiss")}
							</button>
						</div>
					</div>
				</div>
			) : undefined}

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

export default HomePage;
