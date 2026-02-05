/* eslint-disable max-lines */

import { useTranslation } from "react-i18next";

import DemoNavigation from "@/react/demo/DemoNavigation";
import NavigationExample from "@/react/pages/demo/components/NavigationExample";
import PerformanceComparison from "@/react/pages/demo/components/PerformanceComparison";

// Navigation simulator

// PerformanceComparison is now in a dedicated component under
// react/src/pages/demo/components/PerformanceComparison.tsx

/**
 * ActivityDemoPage
 *
 * Demonstrates the React Activity component and related performance
 * comparisons and navigation examples for educational purposes.
 *
 * @returns - A React element presenting activity demos and supporting
 *   explanatory content.
 */
export default function ActivityDemoPage(): ReactElement {
	const { t } = useTranslation();

	return (
		<div>
			<div className="mb-10 text-center">
				<h1 className="mb-4 text-4xl font-bold">
					⚡ {t("pages.activityDemo.title", "React 19.2 Activity Demo")}
				</h1>
				<p className="text-gray-400">
					{t(
						"pages.activityDemo.subtitle",
						"Explore the new Activity component for controlling visibility and rendering priority",
					)}
				</p>
			</div>

			<DemoNavigation />

			<div className="space-y-12">
				{/* Introduction Section */}
				<section className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-6">
					<h2 className="mb-4 text-2xl font-bold text-blue-300">📚 What is Activity?</h2>
					<div className="space-y-4 text-gray-300">
						<p>
							The new <code className="rounded bg-gray-800 px-2 py-1">{"<Activity />"}</code>
							component in React 19.2 lets you break your app into &quot;activities&quot; that can
							be controlled and prioritized.
						</p>
						<p>Instead of conditionally rendering components, you can use Activity to:</p>
						<ul className="ml-4 list-inside list-disc space-y-2">
							<li>
								<strong>Pre-render content:</strong> Render parts of your app that users might
								navigate to next
							</li>
							<li>
								<strong>Preserve state:</strong> Keep component state when switching between views
							</li>
							<li>
								<strong>Optimize performance:</strong> Defer updates on hidden content until React
								has nothing else to do
							</li>
							<li>
								<strong>Improve navigation:</strong> Make page transitions feel instant
							</li>
						</ul>

						<div className="mt-4 rounded-lg bg-gray-800 p-4">
							<h4 className="mb-2 font-semibold">Two modes available:</h4>
							<div className="space-y-2 text-sm">
								<div>
									<code className="text-green-400">visible</code>: Shows children, mounts effects,
									processes updates normally
								</div>
								<div>
									<code className="text-orange-400">hidden</code>: Hides children, unmounts effects,
									defers updates
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Navigation Example */}
				<section className="rounded-lg border border-white/10 bg-white/5 p-6">
					<h2 className="mb-6 text-2xl font-bold text-white">
						🧭 Navigation with State Preservation
					</h2>
					<NavigationExample />
				</section>

				{/* Performance Comparison */}
				<section className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-6">
					<h2 className="mb-6 text-2xl font-bold text-purple-300">🚀 Performance Comparison</h2>
					<PerformanceComparison />
				</section>

				{/* Code Examples */}
				<section className="rounded-lg border border-green-500/20 bg-green-500/10 p-6">
					<h2 className="mb-4 text-2xl font-bold text-green-300">💾 Code Examples</h2>
					<div className="space-y-6">
						<div>
							<h3 className="mb-3 text-lg font-semibold">Before (Conditional Rendering):</h3>
							<pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm">
								<code>{"// Components are mounted/unmounted\nisVisible && <Page />"}</code>
							</pre>
						</div>
						<div>
							<h3 className="mb-3 text-lg font-semibold">After (Activity Component):</h3>
							<pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm">
								<code>{`// Components stay mounted, visibility controlled
<Activity mode=(isVisible ? 'visible' : 'hidden')>
  <Page />
</Activity>`}</code>
							</pre>
						</div>
					</div>
				</section>

				{/* Best Practices */}
				<section className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-6">
					<h2 className="mb-4 text-2xl font-bold text-yellow-300">💡 Best Practices</h2>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div>
							<h4 className="mb-3 font-semibold text-green-300">✅ Good Use Cases:</h4>
							<ul className="space-y-2 text-sm text-gray-300">
								<li>• Pre-rendering pages users might navigate to</li>
								<li>• Preserving form state when switching tabs</li>
								<li>• Background data loading and processing</li>
								<li>• Modal dialogs and overlays</li>
								<li>• Dashboard widgets that can be toggled</li>
							</ul>
						</div>
						<div>
							<h4 className="mb-3 font-semibold text-red-300">❌ Avoid For:</h4>
							<ul className="space-y-2 text-sm text-gray-300">
								<li>• Components that are rarely used</li>
								<li>• Memory-intensive components</li>
								<li>• Components with expensive side effects</li>
								<li>• Simple show/hide logic</li>
								<li>• Components that don&apos;t benefit from state preservation</li>
							</ul>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
