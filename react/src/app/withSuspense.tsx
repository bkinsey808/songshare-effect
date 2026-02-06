import { Suspense } from "react";

import PageLoadingFallback from "./PageLoadingFallback";

/**
 * Wraps a lazy route component in Suspense with the page-level fallback.
 *
 * @param Component - Lazy component to wrap
 * @returns - React element that renders the lazy component inside Suspense
 */
export default function withSuspense(
	Component: React.LazyExoticComponent<React.ComponentType>,
): ReactElement {
	return (
		<Suspense fallback={<PageLoadingFallback />}>
			<Component />
		</Suspense>
	);
}
