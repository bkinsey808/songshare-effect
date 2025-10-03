import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { detectBrowserLanguage, getStoredLanguage } from "./languageStorage";

export default function LanguageDetector(): ReactElement {
	const navigate = useNavigate();

	useEffect(() => {
		// Priority order for language selection:
		// 1. Stored language preference (localStorage/cookies)
		// 2. Browser language detection
		// 3. Default fallback (en)

		const storedLang = getStoredLanguage();
		const browserLang = detectBrowserLanguage(navigator.language);

		// Use stored preference if available, otherwise browser detection
		const selectedLang = storedLang ?? browserLang;

		void navigate(`/${selectedLang}/`, { replace: true });
	}, [navigate]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<div className="mb-2">Redirecting to your preferred language...</div>
				<div className="text-sm text-gray-400">
					Detecting language preferences
				</div>
			</div>
		</div>
	);
}
