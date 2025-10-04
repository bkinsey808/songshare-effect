import { useTranslation } from "react-i18next";

import DemoNavigation from "../components/DemoNavigation";
import SuspenseDemo from "../components/SuspenseDemo";

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
