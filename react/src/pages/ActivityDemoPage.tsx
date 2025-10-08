/* eslint-disable line-comment-position */
import { Activity, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import DemoNavigation from "../demo/DemoNavigation";

// Simulated heavy component that takes time to render
function HeavyComponent({
	name,
	color,
}: Readonly<{
	name: string;
	color: string;
}>): ReactElement {
	const [renderTime, setRenderTime] = useState<number>(0);

	useEffect(() => {
		const start = performance.now();
		// Simulate some heavy computation
		let _result = 0;
		for (let i = 0; i < 1000000; i++) {
			// eslint-disable-next-line sonarjs/pseudo-random
			_result += Math.random();
		}
		const end = performance.now();
		setRenderTime(end - start);
	}, []);

	return (
		<div className={`rounded-lg border p-6 ${color}`}>
			<h3 className="mb-2 text-xl font-semibold">{name}</h3>
			<p className="mb-4 text-gray-300">
				This component simulates heavy computation and rendering.
			</p>
			<div className="text-sm text-gray-400">
				Render time: {renderTime.toFixed(2)}ms
			</div>
			<div className="mt-4 space-y-2">
				<div className="h-4 animate-pulse rounded bg-gray-600"></div>
				<div className="h-4 w-3/4 animate-pulse rounded bg-gray-600"></div>
				<div className="h-4 w-1/2 animate-pulse rounded bg-gray-600"></div>
			</div>
		</div>
	);
}

// Component with input to demonstrate state preservation
function InteractiveComponent({
	title,
}: Readonly<{ title: string }>): ReactElement {
	const [inputValue, setInputValue] = useState("");
	const [count, setCount] = useState(0);

	useEffect(() => {
		// Mount/unmount logging would normally be useful for debugging
		// but we'll skip console.log due to linting rules
		return () => {
			// Cleanup if needed
		};
	}, [title]);

	return (
		<div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-6">
			<h3 className="mb-4 text-xl font-semibold text-purple-300">{title}</h3>
			<div className="space-y-4">
				<div>
					<label
						htmlFor={`input-${title}`}
						className="mb-2 block text-sm font-medium text-gray-300"
					>
						Text Input (preserved when hidden):
					</label>
					<input
						id={`input-${title}`}
						type="text"
						value={inputValue}
						onChange={(ev) => setInputValue(ev.target.value)}
						placeholder="Type something..."
						className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
					/>
				</div>
				<div>
					<div className="mb-2 block text-sm font-medium text-gray-300">
						Counter: {count}
					</div>
					<button
						onClick={() => setCount((cnt) => cnt + 1)}
						className="rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
					>
						Increment
					</button>
				</div>
			</div>
		</div>
	);
}

// Navigation simulator
function NavigationExample(): ReactElement {
	const [currentPage, setCurrentPage] = useState<
		"home" | "profile" | "settings"
	>("home");

	const pages = [
		{
			id: "home",
			label: "Home",
			color: "border-blue-500/20 bg-blue-500/10",
		},
		{
			id: "profile",
			label: "Profile",
			color: "border-green-500/20 bg-green-500/10",
		},
		{
			id: "settings",
			label: "Settings",
			color: "border-yellow-500/20 bg-yellow-500/10",
		},
	] as const;

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h3 className="mb-4 text-xl font-semibold">
					Navigation with Activity Pre-rendering
				</h3>
				<p className="mb-6 text-gray-400">
					Pages you&apos;re not viewing are pre-rendered in the background using{" "}
					Activity (hidden mode). This makes navigation instant while preserving{" "}
					state.
				</p>
				<div className="flex justify-center space-x-4">
					{pages.map((page) => (
						<button
							key={page.id}
							onClick={() => setCurrentPage(page.id)}
							className={`rounded-lg px-6 py-2 font-medium transition-all ${
								currentPage === page.id
									? "bg-white text-black"
									: "bg-gray-700 text-gray-300 hover:bg-gray-600"
							}`}
						>
							{page.label}
						</button>
					))}
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6">
				{pages.map((page) => (
					<Activity
						key={page.id}
						mode={currentPage === page.id ? "visible" : "hidden"}
					>
						<div className={`rounded-lg border p-6 ${page.color}`}>
							<h4 className="mb-4 text-lg font-semibold">{page.label} Page</h4>
							<InteractiveComponent
								title={`${page.label} Interactive Component`}
							/>
						</div>
					</Activity>
				))}
			</div>
		</div>
	);
}

// Performance comparison demo
function PerformanceComparison(): ReactElement {
	const [showHeavyComponents, setShowHeavyComponents] = useState(false);
	const [useActivity, setUseActivity] = useState(true);

	const heavyComponents = [
		{ name: "Chart Component", color: "border-red-500/20 bg-red-500/10" },
		{ name: "Data Table", color: "border-blue-500/20 bg-blue-500/10" },
		{ name: "Image Gallery", color: "border-green-500/20 bg-green-500/10" },
	];

	return (
		<div className="space-y-6">
			<div>
				<h3 className="mb-4 text-xl font-semibold">Performance Comparison</h3>
				<p className="mb-6 text-gray-400">
					Compare rendering with Activity (deferred updates) vs traditional{" "}
					conditional rendering. With Activity, heavy components are{" "}
					pre-rendered without blocking the UI.
				</p>

				<div className="mb-6 flex flex-wrap gap-4">
					<button
						onClick={() => setShowHeavyComponents(!showHeavyComponents)}
						className={`rounded-lg px-6 py-2 font-medium transition-colors ${
							showHeavyComponents
								? "bg-green-600 text-white"
								: "bg-gray-700 text-gray-300 hover:bg-gray-600"
						}`}
					>
						{showHeavyComponents ? "Hide" : "Show"} Heavy Components
					</button>

					<button
						onClick={() => setUseActivity(!useActivity)}
						className={`rounded-lg px-6 py-2 font-medium transition-colors ${
							useActivity
								? "bg-purple-600 text-white"
								: "bg-gray-700 text-gray-300 hover:bg-gray-600"
						}`}
					>
						Use Activity: {useActivity ? "ON" : "OFF"}
					</button>
				</div>

				<div className="mb-4 text-sm text-gray-400">
					<strong>Current mode:</strong>{" "}
					{useActivity
						? "Activity (deferred updates)"
						: "Conditional rendering"}
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{useActivity
					? // Using Activity - components are always rendered but hidden when not visible
						heavyComponents.map((component, index) => (
							<Activity
								key={index}
								mode={showHeavyComponents ? "visible" : "hidden"}
							>
								<HeavyComponent name={component.name} color={component.color} />
							</Activity>
						))
					: // Traditional conditional rendering - components are unmounted when hidden
						showHeavyComponents &&
						heavyComponents.map((component, index) => (
							<HeavyComponent
								key={index}
								name={component.name}
								color={component.color}
							/>
						))}
			</div>

			{!showHeavyComponents && (
				<div className="p-8 text-center text-gray-400">
					{useActivity
						? "Components are rendered in the background (Activity mode: hidden)"
						: "Components are not rendered (conditional rendering)"}
				</div>
			)}
		</div>
	);
}

function ActivityDemoPage(): ReactElement {
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
					<h2 className="mb-4 text-2xl font-bold text-blue-300">
						📚 What is Activity?
					</h2>
					<div className="space-y-4 text-gray-300">
						<p>
							The new{" "}
							<code className="rounded bg-gray-800 px-2 py-1">
								{"<Activity />"}
							</code>{" "}
							component in React 19.2 lets you break your app into "activities"
							that can be controlled and prioritized.
						</p>
						<p>
							Instead of conditionally rendering components, you can use
							Activity to:
						</p>
						<ul className="ml-4 list-inside list-disc space-y-2">
							<li>
								<strong>Pre-render content:</strong> Render parts of your app
								that users might navigate to next
							</li>
							<li>
								<strong>Preserve state:</strong> Keep component state when
								switching between views
							</li>
							<li>
								<strong>Optimize performance:</strong> Defer updates on hidden
								content until React has nothing else to do
							</li>
							<li>
								<strong>Improve navigation:</strong> Make page transitions feel
								instant
							</li>
						</ul>
						<div className="mt-4 rounded-lg bg-gray-800 p-4">
							<h4 className="mb-2 font-semibold">Two modes available:</h4>
							<div className="space-y-2 text-sm">
								<div>
									<code className="text-green-400">visible</code>: Shows
									children, mounts effects, processes updates normally
								</div>
								<div>
									<code className="text-orange-400">hidden</code>: Hides
									children, unmounts effects, defers updates
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
					<h2 className="mb-6 text-2xl font-bold text-purple-300">
						🚀 Performance Comparison
					</h2>
					<PerformanceComparison />
				</section>

				{/* Code Examples */}
				<section className="rounded-lg border border-green-500/20 bg-green-500/10 p-6">
					<h2 className="mb-4 text-2xl font-bold text-green-300">
						💾 Code Examples
					</h2>
					<div className="space-y-6">
						<div>
							<h3 className="mb-3 text-lg font-semibold">
								Before (Conditional Rendering):
							</h3>
							<pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm">
								<code>{`// Components are mounted/unmounted
{isVisible && <Page />}`}</code>
							</pre>
						</div>
						<div>
							<h3 className="mb-3 text-lg font-semibold">
								After (Activity Component):
							</h3>
							<pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm">
								<code>{`// Components stay mounted, visibility controlled
<Activity mode={isVisible ? 'visible' : 'hidden'}>
  <Page />
</Activity>`}</code>
							</pre>
						</div>
					</div>
				</section>

				{/* Best Practices */}
				<section className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-6">
					<h2 className="mb-4 text-2xl font-bold text-yellow-300">
						💡 Best Practices
					</h2>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div>
							<h4 className="mb-3 font-semibold text-green-300">
								✅ Good Use Cases:
							</h4>
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
								<li>• Components that don't benefit from state preservation</li>
							</ul>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

export default ActivityDemoPage;
