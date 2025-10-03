import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import LanguageSwitcher from "../language/LanguageSwitcher";
import type { SupportedLanguage } from "@/shared/language/supportedLanguages";

function Navigation(): ReactElement {
	const { t, i18n } = useTranslation();
	const currentLang = i18n.language as SupportedLanguage;

	const navItems = [
		{ path: "", labelKey: "navigation.home", icon: "🏠" },
		{ path: "songs", labelKey: "navigation.songs", icon: "🎵" },
		{ path: "upload", labelKey: "navigation.upload", icon: "📤" },
		{ path: "suspense-use", labelKey: "navigation.suspenseUse", icon: "🔄" },
		{
			path: "user-subscription",
			labelKey: "navigation.userSubscription",
			icon: "👥",
		},
		{ path: "about", labelKey: "navigation.about", icon: "ℹ️" },
	];

	return (
		<nav className="mb-10 flex flex-wrap justify-center gap-5 rounded-xl bg-gray-800 p-5">
			<div className="mb-4 flex w-full items-center justify-between">
				<div className="flex flex-wrap gap-5">
					{navItems.map((item) => (
						<Link
							key={item.path}
							to={`/${currentLang}/${item.path}`}
							className="hover:border-primary-500 flex cursor-pointer items-center gap-2 rounded-lg border-2 border-gray-600 bg-transparent px-5 py-3 text-base font-medium text-white transition-all duration-200 hover:bg-gray-700"
						>
							<span>{item.icon}</span>
							<span>{t(item.labelKey)}</span>
						</Link>
					))}
				</div>

				{/* Language Switcher in Navigation */}
				<div className="ml-4">
					<LanguageSwitcher />
				</div>
			</div>
		</nav>
	);
}

export default Navigation;
