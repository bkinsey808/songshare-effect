/**
 * Page loading fallback for route-level code splitting
 *
 * @returns - React element showing a small loading spinner
 */
export default function PageLoadingFallback(): ReactElement {
	return (
		<div className="flex items-center justify-center py-12">
			<div className="text-center">
				<div className="border-primary-500 mb-4 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
				<p className="text-sm text-gray-400">Loading...</p>
			</div>
		</div>
	);
}
