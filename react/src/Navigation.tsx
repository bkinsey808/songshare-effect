import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import useLocale from "@/react/language/locale/useLocale";
import { SCROLL_THRESHOLD } from "@/shared/constants/http";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { aboutPath } from "@/shared/paths";

import LanguageSwitcher from "./language/switcher/LanguageSwitcher";

function Navigation(): ReactElement {
	const { lang, t } = useLocale();
	const location = useLocation();
	const [isScrolled, setIsScrolled] = useState(false);

	// Listen for scroll events to compress navigation
	useEffect(() => {
		function handleScroll(): void {
			const scrollTop = globalThis.scrollY;
			setIsScrolled(scrollTop > SCROLL_THRESHOLD);
		}

		globalThis.addEventListener("scroll", handleScroll);
		return (): void => {
			globalThis.removeEventListener("scroll", handleScroll);
		};
	}, []);

	const navItems = [
		{ path: "", labelKey: "navigation.home", icon: "🏠" },
		{ path: aboutPath, labelKey: "navigation.about", icon: "ℹ️" },
	];

	// Function to check if a navigation item is active
	function isActive(itemPath: string): boolean {
		const currentPath = location.pathname;
		// Build the canonical path for this item using the centralized helper
		const targetPath = buildPathWithLang(itemPath ? `/${itemPath}` : "/", lang);

		if (itemPath === "") {
			// Home page - match canonical home path exactly
			return currentPath === targetPath || currentPath === `${targetPath}/`;
		}

		// For other pages, consider the item active when the current path equals
		// the target or is a descendant (startsWith). This mirrors react-router behavior.
		return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
	}

	return (
		<nav
			className={`fixed top-0 right-0 left-0 z-50 bg-gray-800 transition-all duration-300 ${
				isScrolled ? "px-4 py-2 shadow-lg" : "px-5 py-5"
			}`}
		>
			{/* App Title and Subtitle */}
			<div className={`text-center transition-all duration-300 ${isScrolled ? "mb-2" : "mb-6"}`}>
				<h1
					className={`font-bold text-white transition-all duration-300 ${
						isScrolled ? "mb-0 text-2xl" : "mb-2 text-4xl"
					}`}
				>
					🎵 {t("app.title")}
				</h1>
				{!isScrolled && (
					<p className="text-gray-400 transition-opacity duration-300">{t("app.subtitle")}</p>
				)}
			</div>

			{/* Navigation Items and Language Switcher */}
			<div className="flex flex-wrap items-center justify-between gap-5">
				<div className="flex flex-wrap gap-5">
					{navItems.map((item) => {
						const active = isActive(item.path);
						return (
							<Link
								key={item.path}
								to={buildPathWithLang(item.path ? `/${item.path}` : "/", lang)}
								className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-5 py-3 text-base font-medium transition-all duration-200 ${
									active
										? "border-primary-500 bg-primary-500/20 text-primary-300 shadow-md"
										: "hover:border-primary-500 border-gray-600 bg-transparent text-white hover:bg-gray-700"
								}`}
							>
								<span>{item.icon}</span>
								<span>{t(item.labelKey)}</span>
							</Link>
						);
					})}
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
