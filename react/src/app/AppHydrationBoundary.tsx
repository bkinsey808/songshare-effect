import { Suspense } from "react";

import AppLoadingFallback from "./AppLoadingFallback";
import HydratedLayout from "./HydratedLayout";

/**
 * Suspense boundary for application-level store hydration.
 *
 * Renders an app-wide fallback while the persisted app store is rehydrated so
 * child components and hooks that depend on the store mount consistently
 * without hydration/timing races.
 *
 * Trade-offs
 * - Boundary (this component): minimal surface area and no public API; prefer
 *   when the only goal is an app-level fallback and you don't need to read
 *   hydration state from multiple consumers.
 * - Provider/Context: exposes `isHydrated` and helpers (e.g. `awaitHydration`) to
 *   consumers, making it easy to await or react to hydration across the app;
 *   prefer when many parts of the UI need the hydration status or must await it.
 * - Complexity: a Provider adds surface area and tests; the Boundary keeps the
 *   implementation simple and avoids adding unnecessary context.
 *
 * @returns React element rendering the hydration boundary and app layout
 */
export default function AppHydrationBoundary(): ReactElement {
	return (
		<Suspense fallback={<AppLoadingFallback />}>
			<HydratedLayout />
		</Suspense>
	);
}
