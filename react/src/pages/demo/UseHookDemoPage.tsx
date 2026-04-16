import { Suspense } from "react";
import { useTranslation } from "react-i18next";

import DemoNavigation from "@/react/demo/DemoNavigation";
import UseHookDemo from "@/react/demo/UseHookDemo";

/**
 * Demo page showcasing `use` hook usage and suspense integration.
 *
 * @returns ReactElement rendering the demo
 */
function UseHookDemoPage(): ReactElement {
	const { t } = useTranslation();

	return (
		<div>
			<div className="mb-10 text-center">
				<h1 className="mb-4 text-4xl font-bold">
					🔀 {t("pages.useHookDemo.title", "Use Hook Demo")}
				</h1>
				<p className="text-gray-400">
					{t(
						"pages.useHookDemo.subtitle",
						"Explore the new React 'use' hook for reading promises and context values",
					)}
				</p>
			</div>

			<DemoNavigation />

			<Suspense fallback={<div className="p-5 text-center">Loading Use Hook Demo...</div>}>
				<UseHookDemo />
			</Suspense>
		</div>
	);
}

export default UseHookDemoPage;
