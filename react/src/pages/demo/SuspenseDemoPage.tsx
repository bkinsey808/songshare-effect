import { useTranslation } from "react-i18next";

import DemoNavigation from "@/react/demo/DemoNavigation";
import SuspenseDemo from "@/react/demo/SuspenseDemo";

/**
 * Demo page showing React Suspense usage examples.
 *
 * @returns ReactElement rendering the suspense demo
 */
function SuspenseDemoPage(): ReactElement {
	const { t } = useTranslation();

	return (
		<div>
			<div className="mb-10 text-center">
				<h1 className="mb-4 text-4xl font-bold">
					🔄 {t("pages.suspenseDemo.title", "Suspense Demo")}
				</h1>
				<p className="text-gray-400">
					{t(
						"pages.suspenseDemo.subtitle",
						"Interactive demonstration of React Suspense with promise-based data fetching",
					)}
				</p>
			</div>

			<DemoNavigation />

			<SuspenseDemo />
		</div>
	);
}

export default SuspenseDemoPage;
