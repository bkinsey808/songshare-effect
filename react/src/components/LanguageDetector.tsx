import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
	detectBrowserLanguage,
	getStoredLanguage,
} from "../utils/languageStorage";

export default function LanguageDetector(): ReactElement {
	const navigate = useNavigate();

	useEffect(() => {
		// First try to get stored language preference
		const storedLang = getStoredLanguage();

		// If user has a stored preference, use it; otherwise detect from browser
		const selectedLang =
			storedLang ?? detectBrowserLanguage(navigator.language);

		void navigate(`/${selectedLang}/`, { replace: true });
	}, [navigate]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			Redirecting...
		</div>
	);
}
