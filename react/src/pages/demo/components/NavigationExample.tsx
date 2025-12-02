import { Activity, useState } from "react";

import InteractiveComponent from "@/react/pages/demo/components/InteractiveComponent";

function NavigationExample(): ReactElement {
	const [currentPage, setCurrentPage] = useState<"home" | "profile" | "settings">("home");

	const pages = [
		{ id: "home", label: "Home", color: "border-blue-500/20 bg-blue-500/10" },
		{ id: "profile", label: "Profile", color: "border-green-500/20 bg-green-500/10" },
		{ id: "settings", label: "Settings", color: "border-yellow-500/20 bg-yellow-500/10" },
	] as const;

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h3 className="mb-4 text-xl font-semibold">Navigation with Activity Pre-rendering</h3>
				<p className="mb-6 text-gray-400">
					Pages you&apos;re not viewing are pre-rendered in the background using Activity (hidden
					mode). This makes navigation instant while preserving state.
				</p>
				<div className="flex justify-center space-x-4">
					{pages.map((page) => (
						<button
							type="button"
							key={page.id}
							onClick={() => {
								setCurrentPage(page.id);
							}}
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
					<Activity key={page.id} mode={currentPage === page.id ? "visible" : "hidden"}>
						<div className={`rounded-lg border p-6 ${page.color}`}>
							<h4 className="mb-4 text-lg font-semibold">{page.label} Page</h4>
							<InteractiveComponent title={`${page.label} Interactive Component`} />
						</div>
					</Activity>
				))}
			</div>
		</div>
	);
}

export default NavigationExample;
