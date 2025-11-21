import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { setStoredLanguage } from "@/react/language/languageStorage";
import type { SupportedLanguageType } from "@/shared/language/supported-languages";

export default function LanguageTest(): ReactElement {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();

	const testTranslation = (key: string): string => {
		try {
			return t(key);
		} catch (error) {
			return `Error: ${String(error)}`;
		}
	};

	const switchLanguage = (newLang: SupportedLanguageType): void => {
		// Update stored preference (like real language switcher)
		setStoredLanguage(newLang);

		// Extract the path without the language prefix
		const currentPath = location.pathname.substring(3) || "/";

		// Navigate to the new language URL
		void navigate(`/${newLang}${currentPath}`);
	};

	return (
		<div className="rounded-lg bg-gray-800 p-4 text-white">
			<h3 className="mb-4 text-lg font-bold">Language Test Debug</h3>
			<div className="space-y-2 text-sm">
				<p>
					<strong>Current Language:</strong> {i18n.language}
				</p>
				<p>
					<strong>Available Languages:</strong>{" "}
					{Object.keys(i18n.store.data).join(", ")}
				</p>
				<p>
					<strong>Test Translation (pages.home.title):</strong> "
					{testTranslation("pages.home.title")}"
				</p>
				<p>
					<strong>Test Translation (app.title):</strong> "
					{testTranslation("app.title")}"
				</p>
				<p>
					<strong>Test Translation (navigation.home):</strong> "
					{testTranslation("navigation.home")}"
				</p>
				<div className="mt-4">
					<button
						className="mr-2 rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
						onClick={() => switchLanguage("en")}
					>
						Switch to EN (Updates Preference)
					</button>
					<button
						className="mr-2 rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
						onClick={() => switchLanguage("zh")}
					>
						Switch to ZH (Updates Preference)
					</button>
					<button
						className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
						onClick={() => switchLanguage("es")}
					>
						Switch to ES (Updates Preference)
					</button>
				</div>
			</div>
		</div>
	);
}
