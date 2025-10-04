import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import LanguageSwitcher from "../language/LanguageSwitcher";
import type { SupportedLanguage } from "@/shared/language/supportedLanguages";
import { aboutPath } from "@/shared/paths";

function Navigation(): ReactElement {
	const { t, i18n } = useTranslation();
	const currentLang = i18n.language as SupportedLanguage;
	const location = useLocation();
	const [isScrolled, setIsScrolled] = useState(false);

	// Listen for scroll events to compress navigation
	useEffect(() => {
		const handleScroll = (): void => {
			const scrollTop = window.scrollY;
			setIsScrolled(scrollTop > 50);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const navItems = [
		{ path: "", labelKey: "navigation.home", icon: "🏠" },
		{ path: aboutPath, labelKey: "navigation.about", icon: "ℹ️" },
	];

	// Function to check if a navigation item is active
	const isActive = (itemPath: string): boolean => {
		const currentPath = location.pathname;
		// Remove language prefix to get the actual route
		const routeWithoutLang = currentPath.replace(`/${currentLang}`, "") || "/";

		if (itemPath === "") {
			// Home page - exact match for root or just language
			return routeWithoutLang === "/" || routeWithoutLang === "";
		}

		// For other pages, check if the path starts with the item path
		return routeWithoutLang.startsWith(`/${itemPath}`);
	};

	return (
		<nav
			className={`fixed top-0 right-0 left-0 z-50 bg-gray-800 transition-all duration-300 ${
				isScrolled ? "px-4 py-2 shadow-lg" : "px-5 py-5"
			}`}
		>
			{/* App Title and Subtitle */}
			<div
				className={`text-center transition-all duration-300 ${
					isScrolled ? "mb-2" : "mb-6"
				}`}
			>
				<h1
					className={`font-bold text-white transition-all duration-300 ${
						isScrolled ? "mb-0 text-2xl" : "mb-2 text-4xl"
					}`}
				>
					🎵 {t("app.title")}
				</h1>
				{!isScrolled && (
					<p className="text-gray-400 transition-opacity duration-300">
						{t("app.subtitle")}
					</p>
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
								to={`/${currentLang}/${item.path}`}
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
