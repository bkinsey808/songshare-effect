import type { ReactNode } from "react";

import { useNavigate } from "react-router-dom";

import Button from "@/react/design-system/Button";
import MenuIcon from "@/react/design-system/icons/MenuIcon";
import SongLibraryIcon from "@/react/design-system/icons/SongLibraryIcon";
import XIcon from "@/react/design-system/icons/XIcon";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { aboutPath, dashboardPath, songLibraryPath } from "@/shared/paths";

import useLocale from "../language/locale/useLocale";
import ActionsMenu from "./ActionsMenu";
import useIsScrolled from "./useIsScrolled";
import useNavigation from "./useNavigation";

/** Primary navigation items displayed in the header.
 * Each item contains a `path` (relative), an i18n `labelKey`, and an `icon`
 * which may be a string emoji or a rendered `ReactNode` icon component.
 */
const navItems: readonly {
	path: string;
	labelKey: string;
	icon: ReactNode;
}[] = [
	{ path: "", labelKey: "navigation.home", icon: "🏠" },
	{
		path: `${dashboardPath}/${songLibraryPath}`,
		labelKey: "navigation.songLibrary",
		icon: <SongLibraryIcon className="size-4" />,
	},
	{ path: aboutPath, labelKey: "navigation.about", icon: "ℹ️" },
];

/**
 * Props for `Navigation`.
 *
 * @param actionsExpanded - Controlled prop to set whether the actions menu is expanded.
 * @param onActionsExpandedChange - Callback invoked when expanded state toggles.
 */
type NavigationProps = {
	readonly actionsExpanded?: boolean;
	readonly onActionsExpandedChange?: (expanded: boolean) => void;
};

/**
 * Top-level app navigation/header.
 *
 * Renders the app title, primary navigation buttons, and the actions toggle.
 * The header responds to scroll state (compact vs expanded) via `useIsScrolled`
 * and exposes an accessible actions toggle (`aria-expanded`) whose visibility is
 * controlled by `useNavigation`. Internationalized labels are pulled from `useLocale`.
 *
 * @param actionsExpanded - Optional controlled expanded state for header actions.
 * @param onActionsExpandedChange - Optional handler called when the actions expand state changes.
 * @returns ReactElement - the rendered navigation/header.
 */
export default function Navigation({
	actionsExpanded,
	onActionsExpandedChange,
}: NavigationProps): ReactElement {
	const navigate = useNavigate();
	const { t, lang } = useLocale();
	const isScrolled = useIsScrolled();

	const { isHeaderActionsExpanded, isActionsVisible, isActive, toggleActions } = useNavigation({
		actionsExpanded,
		onActionsExpandedChange,
	});

	return (
		// Sticky top navigation that adjusts spacing when scrolled to save vertical space.
		<nav className="sticky top-0 z-50 overflow-x-clip bg-gray-800 shadow-lg">
			{/* Primary header content (title + main nav row) */}
			<div>
				<div
					className={`mx-auto max-w-screen-2xl transition-all duration-300 ${
						isScrolled ? "px-4 pt-1 pb-0.5" : "px-5 pt-3 pb-1"
					}`}
				>
					{/* App Title and Subtitle */}
					{/* App title and subtitle: this block shrinks and fades the subtitle when scrolled. */}
					<div
						className={`text-center transition-all duration-300 ${isScrolled ? "mb-1" : "mb-3"}`}
					>
						<h1
							className={`font-bold text-white transition-all duration-300 ${
								isScrolled ? "mb-0 text-2xl" : "mb-1 text-4xl"
							}`}
						>
							🎵 {t("app.title")}
						</h1>
						{!isScrolled && (
							<p className="text-gray-400 transition-opacity duration-300">{t("app.subtitle")}</p>
						)}
					</div>

					{/* Main navigation row */}
					<div className="flex flex-wrap items-center justify-between gap-5">
						<div className="flex flex-wrap gap-5">
							{/* Render primary nav buttons; `isActive` determines button variant and `buildPathWithLang` ensures language-aware routing. */}
							{navItems.map((item) => {
								const active = isActive(item.path);
								const path = buildPathWithLang(item.path ? `/${item.path}` : "/", lang);
								return (
									<Button
										key={item.path}
										size="compact"
										variant={active ? "primary" : "outlineSecondary"}
										icon={
											typeof item.icon === "string" ? (
												<span aria-hidden>{item.icon}</span>
											) : (
												item.icon
											)
										}
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

						{/* Right-side controls - Actions toggle now lives where the language selector was */}
						<div className="ml-4 flex items-center gap-3">
							{/* Dark background wrapper extends to the right edge of the viewport using large horizontal padding and negative margins. */}
							<div
								className={`pl-2 py-1 -ml-2 -my-1 pr-[50vw] -mr-[50vw] transition-colors duration-200 ${
									isHeaderActionsExpanded ? "bg-slate-950" : "bg-transparent"
								}`}
							>
								{/* Actions toggle button with accessible `aria-expanded` and localized `aria-label`. */}
								<Button
									size="compact"
									variant="outlineSecondary"
									icon={
										isHeaderActionsExpanded ? (
											<XIcon className="size-4" />
										) : (
											<MenuIcon className="size-4" />
										)
									}
									onClick={toggleActions}
									className="inline-flex !rounded-md"
									aria-expanded={isHeaderActionsExpanded}
									aria-label={
										isHeaderActionsExpanded
											? t("navigation.hideActions", "Hide actions")
											: t("navigation.showActions", "Show actions")
									}
									data-testid="navigation-header-actions-toggle"
								>
									{t("navigation.actions", "Actions")}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Actions menu panel is rendered separately; visibility controlled by `isActionsVisible`. */}
			<ActionsMenu isVisible={isActionsVisible} isScrolled={isScrolled} />
		</nav>
	);
}
