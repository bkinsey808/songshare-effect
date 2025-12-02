import { Activity, useState } from "react";

import HeavyComponent from "@/react/pages/demo/components/HeavyComponent";

export default function PerformanceComparison(): ReactElement {
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
					Compare rendering with Activity (deferred updates) vs traditional conditional rendering.
					With Activity, heavy components are pre-rendered without blocking the UI.
				</p>

				<div className="mb-6 flex flex-wrap gap-4">
					<button
						type="button"
						onClick={() => {
							setShowHeavyComponents(!showHeavyComponents);
						}}
						className={`rounded-lg px-6 py-2 font-medium transition-colors ${
							showHeavyComponents
								? "bg-green-600 text-white"
								: "bg-gray-700 text-gray-300 hover:bg-gray-600"
						}`}
					>
						{showHeavyComponents ? "Hide" : "Show"} Heavy Components
					</button>

					<button
						type="button"
						onClick={() => {
							setUseActivity(!useActivity);
						}}
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
					{useActivity ? "Activity (deferred updates)" : "Conditional rendering"}
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{useActivity
					? // Using Activity - components are always rendered but hidden when not visible
						heavyComponents.map((component) => (
							<Activity key={component.name} mode={showHeavyComponents ? "visible" : "hidden"}>
								<HeavyComponent name={component.name} color={component.color} />
							</Activity>
						))
					: // Traditional conditional rendering - components are unmounted when hidden
						showHeavyComponents &&
						heavyComponents.map((component) => (
							<HeavyComponent key={component.name} name={component.name} color={component.color} />
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
