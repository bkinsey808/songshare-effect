import { Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useParams } from "react-router-dom";

import { getStoredLanguage, setStoredLanguage } from "./languageStorage";
import {
	SUPPORTED_LANGUAGES,
	type SupportedLanguage,
} from "@/shared/language/supportedLanguages";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function LanguageProviderInner() {
	const { lang } = useParams<{ lang: string }>();
	const { i18n } = useTranslation();

	// Validate language parameter first
	const isValidLang = Boolean(
		lang !== undefined &&
			lang !== null &&
			SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage),
	);

	// Handle language changes and preference management
	useEffect(() => {
		if (isValidLang === true) {
			const currentLang = lang as SupportedLanguage;
			const storedPreference = getStoredLanguage();

			// Check if user has a different stored preference
			// If they do, this might be an external link or direct navigation
			// We'll respect the URL for display but NOT override their stored preference
			const hasExistingPreference = storedPreference !== undefined;

			// Only change language if it's different
			if (i18n.language !== currentLang) {
				void i18n.changeLanguage(currentLang);
			}

			// Only update stored preference if user doesn't have one yet
			// This preserves existing preferences while still setting initial preference for new users
			if (!hasExistingPreference) {
				setStoredLanguage(currentLang);
			}

			document.documentElement.lang = currentLang;
		}
	}, [lang, i18n, isValidLang]);

	// Early return after hooks
	if (isValidLang === false) {
		return <Navigate to="/en/" replace />;
	}

	// With Suspense enabled, useTranslation will automatically suspend
	// until translations are ready, so no manual loading state needed
	return <Outlet />;
}

export default function LanguageProvider(): ReactElement {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					Loading...
				</div>
			}
		>
			<LanguageProviderInner />
		</Suspense>
	);
}
