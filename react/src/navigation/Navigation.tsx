import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import getAppName from "@/react/lib/branding/getAppName";
import Button from "@/react/lib/design-system/Button";
import CommunitiesIcon from "@/react/lib/design-system/icons/CommunitiesIcon";
import EventsIcon from "@/react/lib/design-system/icons/EventsIcon";
import ImagesIcon from "@/react/lib/design-system/icons/ImagesIcon";
import MenuIcon from "@/react/lib/design-system/icons/MenuIcon";
import PlaylistLibraryIcon from "@/react/lib/design-system/icons/PlaylistLibraryIcon";
import SongLibraryIcon from "@/react/lib/design-system/icons/SongLibraryIcon";
import UsersIcon from "@/react/lib/design-system/icons/UsersIcon";
import XIcon from "@/react/lib/design-system/icons/XIcon";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import {
	aboutPath,
	communityLibraryPath,
	dashboardPath,
	eventLibraryPath,
	imageLibraryPath,
	playlistLibraryPath,
	songLibraryPath,
	userLibraryPath,
} from "@/shared/paths";

import useLocale from "../lib/language/locale/useLocale";
import AccountMenu from "./AccountMenu";
import ActionsMenu from "./ActionsMenu";
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
	{
		path: `${dashboardPath}/${songLibraryPath}`,
		labelKey: "navigation.songs",
		icon: <SongLibraryIcon className="size-4" />,
	},
	{
		path: `${dashboardPath}/${communityLibraryPath}`,
		labelKey: "navigation.communities",
		icon: <CommunitiesIcon className="size-4" />,
	},
	{
		path: `${dashboardPath}/${eventLibraryPath}`,
		labelKey: "navigation.events",
		icon: <EventsIcon className="size-4" />,
	},
	{
		path: `${dashboardPath}/${playlistLibraryPath}`,
		labelKey: "navigation.playlists",
		icon: <PlaylistLibraryIcon className="size-4" />,
	},
	{
		path: `${dashboardPath}/${userLibraryPath}`,
		labelKey: "navigation.users",
		icon: <UsersIcon className="size-4" />,
	},
	{
		path: `${dashboardPath}/${imageLibraryPath}`,
		labelKey: "navigation.images",
		icon: <ImagesIcon className="size-4" />,
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
	readonly isScrolled: boolean;
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
	isScrolled,
}: NavigationProps): ReactElement {
	const navigate = useNavigate();
	const { t, lang } = useLocale();
	const appName = getAppName(t);
	const currentUsername = useAppStore((state) => state.userSessionData?.userPublic?.username);

	const {
		isHeaderActionsExpanded,
		isActionsVisible,
		isActive,
		toggleActions,
		isAccountMenuExpanded,
		isAccountMenuVisible,
		toggleAccountMenu,
	} = useNavigation({
		actionsExpanded,
		onActionsExpandedChange,
	});

	let menuWrapperBg = "bg-transparent";
	if (isHeaderActionsExpanded) {
		menuWrapperBg = "bg-slate-950";
	} else if (isAccountMenuExpanded) {
		menuWrapperBg = "bg-gray-800";
	}

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
							<button
								type="button"
								onClick={() => {
									void navigate(buildPathWithLang("/", lang));
								}}
								className="inline-flex items-center gap-2"
								aria-label={t("navigation.home", "Home")}
								data-testid="navigation-home"
							>
								🎵 {appName}
							</button>
						</h1>
						{!isScrolled && (
							<p className="text-gray-400 transition-opacity duration-300">{t("app.subtitle")}</p>
						)}
					</div>

					{/* Main navigation row */}
					<div className="flex flex-wrap items-center gap-3 sm:gap-5">
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
										typeof item.icon === "string" ? <span aria-hidden>{item.icon}</span> : item.icon
									}
									onClick={() => {
										void navigate(path);
									}}
									className="rounded-md! items-center! [&>span:first-of-type]:mt-0! text-xs sm:text-sm data-[size=compact]:px-2 data-[size=compact]:py-1 sm:data-[size=compact]:px-3 sm:data-[size=compact]:py-1.5"
								>
									{t(item.labelKey)}
								</Button>
							);
						})}

						{/* Right-side controls - staging badge + signed-in username + Actions toggle */}
						<div className="ml-auto flex items-center gap-2 sm:gap-3">
							{import.meta.env["VITE_ENVIRONMENT"] === "staging" && (
								<span className="rounded bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-300 ring-1 ring-yellow-500/40">
									staging
								</span>
							)}
							{typeof currentUsername === "string" && currentUsername.trim() !== "" && (
								<div
									className={`inline-flex px-2 py-1 -my-1 transition-colors duration-200 ${
										isAccountMenuExpanded ? "bg-slate-950" : "bg-transparent"
									}`}
								>
									<Button
										size="compact"
										variant="outlineSecondary"
										onClick={toggleAccountMenu}
										className="inline-flex rounded-md! text-xs sm:text-sm data-[size=compact]:px-2 data-[size=compact]:py-1 sm:data-[size=compact]:px-3 sm:data-[size=compact]:py-1.5 max-w-32 sm:max-w-48 truncate"
										aria-expanded={isAccountMenuExpanded}
										aria-label={
											isAccountMenuExpanded
												? t("navigation.hideAccountMenu", "Hide account menu")
												: t("navigation.showAccountMenu", "Show account menu")
										}
										data-testid="navigation-account-menu-toggle"
									>
										@{currentUsername}
									</Button>
								</div>
							)}
							{/* Dark background wrapper extends to the right edge of the viewport using large horizontal padding and negative margins.
							    When the account menu is open, use the nav background color so the account menu's dark extension doesn't bleed through. */}
							<div
								className={`pl-2 py-1 -ml-2 -my-1 pr-[50vw] -mr-[50vw] transition-colors duration-200 ${menuWrapperBg}`}
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
									className="inline-flex rounded-md! text-xs sm:text-sm data-[size=compact]:px-2 data-[size=compact]:py-1 sm:data-[size=compact]:px-3 sm:data-[size=compact]:py-1.5"
									aria-expanded={isHeaderActionsExpanded}
									aria-label={
										isHeaderActionsExpanded
											? t("navigation.hideMenu", "Hide menu")
											: t("navigation.showMenu", "Show menu")
									}
									data-testid="navigation-header-actions-toggle"
								>
									{t("navigation.menu", "Menu")}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Actions menu panel is rendered separately; visibility controlled by `isActionsVisible`. */}
			<ActionsMenu isVisible={isActionsVisible} isScrolled={isScrolled} />
			{/* Account menu panel; visibility controlled by `isAccountMenuVisible`. */}
			<AccountMenu isVisible={isAccountMenuVisible} isScrolled={isScrolled} />
		</nav>
	);
}
