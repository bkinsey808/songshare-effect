import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Button from "@/react/design-system/Button";
import SongLibraryIcon from "@/react/design-system/icons/SongLibraryIcon";
import useLocale from "@/react/language/locale/useLocale";
import { SCROLL_THRESHOLD } from "@/shared/constants/http";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { aboutPath, dashboardPath, songLibraryPath } from "@/shared/paths";

import LanguageSwitcher from "./language/switcher/LanguageSwitcher";

const navItems: readonly {
	path: string;
	labelKey: string;
	icon: ReactNode;
}[] = [
	{ path: "", labelKey: "navigation.home", icon: "🏠" },
	{ path: `${dashboardPath}/${songLibraryPath}`, labelKey: "navigation.songLibrary", icon: <SongLibraryIcon className="size-4" /> },
	{ path: aboutPath, labelKey: "navigation.about", icon: "ℹ️" },
];

function Navigation(): ReactElement {
	const { lang, t } = useLocale();
	const location = useLocation();
	const navigate = useNavigate();
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
						const path = buildPathWithLang(item.path ? `/${item.path}` : "/", lang);
						return (
							<Button
								key={item.path}
								size="compact"
								variant={active ? "primary" : "outlineSecondary"}
								icon={typeof item.icon === "string" ? <span aria-hidden>{item.icon}</span> : item.icon}
								onClick={() => {
									void navigate(path);
								}}
								className="!rounded-md !items-center [&>span:first-of-type]:!mt-0"
							>
								{t(item.labelKey)}
							</Button>
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
