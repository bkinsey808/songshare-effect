/**
 * Loading fallback component for Suspense used to indicate app-level hydration.
 *
 * @returns - React element showing app-level loading indicator
 */
export default function AppLoadingFallback(): ReactElement {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-900">
			<div className="text-center">
				<div className="border-primary-500 mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
				<p className="text-gray-300">Loading app...</p>
			</div>
		</div>
	);
}
