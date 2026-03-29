import { Outlet } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserRealtimeSync from "@/react/auth/current-user/useCurrentUserRealtimeSync";
import useEnsureSignedIn from "@/react/auth/ensure-signed-in/useEnsureSignedIn";
import Navigation from "@/react/navigation/Navigation";
import useIsScrolled from "@/react/navigation/useIsScrolled";
import useInitUserLibrary from "@/react/user-library/useInitUserLibrary";

import ErrorBoundary from "../demo/ErrorBoundary";

/**
 * Render the hydrated application layout.
 *
 * Initializes auth state first so hook order stays stable even when the
 * component suspends during hydration. The persisted app store keeps header
 * action state across refreshes.
 *
 * @returns React element rendering the hydrated layout with navigation and outlet.
 */
export default function HydratedLayout(): ReactElement {
	// Initialize auth on every page so public routes (songs, communities, events)
	// can read userSessionData and userLibraryEntries from the store.
	useEnsureSignedIn();
	useCurrentUserRealtimeSync();
	useInitUserLibrary();

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
