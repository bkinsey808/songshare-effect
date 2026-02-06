import { useLocation } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useLocale from "@/react/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import getPathWithoutLang from "@/shared/language/getPathWithoutLang";
import { dashboardPath } from "@/shared/paths";

/**
 * Props for `useNavigation`.
 *
 * `actionsExpanded` is an optional controlled value. When omitted, the hook
 * manages an internal boolean state (`internalActionsExpanded`). `onActionsExpandedChange`
 * is called for both controlled and uncontrolled flows to notify callers of a
 * change in the expanded state.
 */
type UseNavigationProps = {
	readonly actionsExpanded?: boolean | undefined;
	readonly onActionsExpandedChange?: ((expanded: boolean) => void) | undefined;
};

/**
 * Return shape of `useNavigation`.
 *
 * - `isHeaderActionsExpanded`: whether the header's actions area is expanded.
 * - `isActionsVisible`: semantic alias for visibility (kept separate for clarity
 *    in consuming UI code).
 * - `isActive`: function that determines active state for a nav item.
 * - `toggleActions`: toggles the expanded/visible state and notifies consumer.
 */
type UseNavigationReturn = {
	readonly isHeaderActionsExpanded: boolean;
	readonly isActionsVisible: boolean;
	readonly isActive: (itemPath: string) => boolean;
	readonly toggleActions: () => void;
};

/**
 * useNavigation
 *
 * Hook encapsulating navigation-related state/helpers used by the header/nav
 * components. It centralizes active-link detection and controlled/uncontrolled
 * expansion logic for the header actions area.
 *
 * @param props - hook configuration
 * @param props.actionsExpanded - optional controlled expanded state
 * @param props.onActionsExpandedChange - callback invoked when expanded state changes
 * @returns navigation helpers and state
 */
export default function useNavigation({
	actionsExpanded,
	onActionsExpandedChange,
}: UseNavigationProps): UseNavigationReturn {
	const { lang } = useLocale();
	const location = useLocation();

	/**
	 * Use persisted app store state for header actions when uncontrolled. The
	 * persisted default is `true` to avoid a flash of collapsed content on mount.
	 */
	const isHeaderActionsExpandedFromStore = useAppStore((state) => state.isHeaderActionsExpanded);
	const setHeaderActionsExpanded = useAppStore((state) => state.setHeaderActionsExpanded);
	// toggleHeaderActions available on the store if a caller needs it
	// const toggleHeaderActions = useAppStore((s) => s.toggleHeaderActions);

	/**
	 * isActive
	 *
	 * Determines whether the provided `itemPath` corresponds to the current
	 * location. Special handling for the "home" item (empty path) treats both
	 * the language root and the dashboard as the "home" state so the Home button
	 * remains highlighted when signed-in users are redirected to the dashboard.
	 */
	function isActive(itemPath: string): boolean {
		if (itemPath === "") {
			// Home page - active whenever the current route is the language root
			// ("/:lang" or "/:lang/"), regardless of trailing slash. Normalize
			// by stripping a trailing slash and treating empty as "/".
			const currentWithoutLang = getPathWithoutLang(location.pathname);
			const normalized = currentWithoutLang.replace(/\/$/, "") || "/";

			// Treat both the language root ("/") and the dashboard root
			// ("/dashboard") as "home" so the Home button shows as selected
			// even when signed-in users are redirected to the dashboard.
			return normalized === "/" || normalized === `/${dashboardPath}`;
		}

		const currentPath = location.pathname;
		// Build the canonical path for this item using the centralized helper
		// so language prefixes are applied consistently across the app.
		const targetPath = buildPathWithLang(itemPath ? `/${itemPath}` : "/", lang);

		// Consider the item active when the current path equals the target or is
		// a descendant of it (startsWith). This mirrors react-router's notion of
		// nested routes and makes parent items remain highlighted on child pages.
		return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
	}

	// Prefer controlled prop when provided, otherwise fall back to persisted store value.
	const isHeaderActionsExpanded = actionsExpanded ?? isHeaderActionsExpandedFromStore;
	const isActionsVisible = isHeaderActionsExpanded;

	/**
	 * toggleActions
	 *
	 * Toggles the expanded state. When the component is uncontrolled (no
	 * `actionsExpanded` prop), the hook updates the persisted store. Regardless
	 * of controlled/uncontrolled mode, it will call `onActionsExpandedChange`
	 * if provided so parents can react to the change (e.g., local UI sync).
	 */
	function toggleActions(): void {
		const next = !isHeaderActionsExpanded;
		if (actionsExpanded === undefined) {
			setHeaderActionsExpanded(next);
		}
		onActionsExpandedChange?.(next);
	}

	return {
		isHeaderActionsExpanded,
		isActionsVisible,
		isActive,
		toggleActions,
	};
}
