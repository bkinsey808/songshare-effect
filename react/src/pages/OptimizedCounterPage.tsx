import { useTranslation } from "react-i18next";

import DemoNavigation from "@/react/demo/DemoNavigation";
import OptimizedCounter from "@/react/demo/OptimizedCounter";

function OptimizedCounterPage(): ReactElement {
	const { t } = useTranslation();

	return (
		<div>
			<div className="mb-10 text-center">
				<h1 className="mb-4 text-4xl font-bold">
					⚡ {t("pages.optimizedCounter.title", "Optimized Counter")}
				</h1>
				<p className="text-gray-400">
					{t(
						"pages.optimizedCounter.subtitle",
						"Demonstration of React performance optimization techniques with counters",
					)}
				</p>
			</div>

			<DemoNavigation />

			<OptimizedCounter />

			<div className="mt-8 rounded-lg border border-blue-500/20 bg-blue-500/10 p-6">
				<h3 className="mb-3 text-lg font-semibold text-blue-300">
					💡 Performance Optimization Features:
				</h3>
				<ul className="space-y-2 text-sm text-blue-200">
					<li>• React.memo for preventing unnecessary re-renders</li>
					<li>• useCallback for memoizing event handlers</li>
					<li>• useMemo for expensive calculations</li>
					<li>• Proper state management to minimize updates</li>
					<li>• Component splitting for better optimization</li>
				</ul>
			</div>
		</div>
	);
}

export default OptimizedCounterPage;
