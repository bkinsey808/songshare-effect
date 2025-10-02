import { Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useParams } from "react-router-dom";

import { setStoredLanguage } from "../utils/languageStorage";
import {
	SUPPORTED_LANGUAGES,
	type SupportedLanguage,
} from "@/shared/supportedLanguages";

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

	// Always call hooks in the same order
	useEffect(() => {
		if (isValidLang === true) {
			const currentLang = lang as SupportedLanguage;
			if (i18n.language !== currentLang) {
				void i18n.changeLanguage(currentLang);
			}
			setStoredLanguage(currentLang);
			document.documentElement.lang = currentLang;
		}
	}, [lang, i18n, isValidLang]);

	// Early return after hooks
	if (isValidLang === false) {
		return <Navigate to="/en/" replace />;
	}

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
