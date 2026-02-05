import { Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useParams } from "react-router-dom";

import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

import { persistLanguagePreferenceIfMissing } from "./persistLanguagePreference";

function LanguageProviderInner(): ReactElement {
	const { lang } = useParams<{ lang: string }>();
	const { i18n } = useTranslation();

	// Validate language parameter first
	const isValidLang = isSupportedLanguage(lang);

	// Handle language changes and preference management
	useEffect(() => {
		// Immediately apply URL language for display (do not block on cookie read)
		if (isSupportedLanguage(lang)) {
			const currentLang = lang;
			if (i18n.language !== currentLang) {
				void i18n.changeLanguage(currentLang);
			}
			document.documentElement.lang = currentLang;

			// Resolve stored preference asynchronously (best-effort)
			void persistLanguagePreferenceIfMissing(currentLang);
		}
	}, [lang, i18n, isValidLang]);

	// Early return after hooks
	if (!isSupportedLanguage(lang)) {
		return <Navigate to={`/${defaultLanguage}/`} replace />;
	}

	// With Suspense enabled, useTranslation will automatically suspend
	// until translations are ready, so no manual loading state needed
	return <Outlet />;
}
/**
 * Top-level language provider that ensures the i18n runtime is ready and applies
 * URL-driven language preferences. Wraps `LanguageProviderInner` with a Suspense
 * boundary to handle async translation loading.
 *
 * @returns A provider that ensures language is applied for nested routes
 */ export default function LanguageProvider(): ReactElement {
	return (
		<Suspense
			fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}
		>
			<LanguageProviderInner />
		</Suspense>
	);
}
