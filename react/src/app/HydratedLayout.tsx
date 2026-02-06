import { Outlet } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import Navigation from "@/react/navigation/Navigation";
import useIsScrolled from "@/react/navigation/useIsScrolled";

import ErrorBoundary from "../demo/ErrorBoundary";

/**
 * HydratedLayout
 * Initialize auth state first so the order of Hooks is stable even
 * when the component suspends during hydration.
 *
 * Uses persisted app store for header actions so the toggle state survives refresh.
 *
 * @returns - React element rendering hydrated layout with navigation and outlet
 */
export default function HydratedLayout(): ReactElement {
	// Use persisted app store for header actions so the toggle state survives refresh
	const isActionsExpanded = useAppStore((state) => state.isHeaderActionsExpanded);
	const setIsActionsExpanded = useAppStore((state) => state.setHeaderActionsExpanded);
	const isScrolled = useIsScrolled();

	return (
		<ErrorBoundary>
			<Navigation
				actionsExpanded={isActionsExpanded}
				onActionsExpandedChange={setIsActionsExpanded}
				isScrolled={isScrolled}
			/>
			<div
				className={`mx-auto max-w-screen-2xl p-5 pt-4 font-sans ${isScrolled ? "pb-36" : "pb-24"}`}
			>
				<main>
					<Outlet />
				</main>
			</div>
		</ErrorBoundary>
	);
}
