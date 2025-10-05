import { useTranslation } from "react-i18next";

import DemoNavigation from "../components/DemoNavigation";
import SuspenseProblemDemo from "../components/SuspenseProblemDemo";

function SuspenseProblemDemoPage(): React.JSX.Element {
	const { t } = useTranslation();

	return (
		<div>
			<div className="mb-10 text-center">
				<h1 className="mb-4 text-4xl font-bold">
					⚠️{" "}
					{t(
						"pages.suspenseProblemDemo.title",
						"React Compiler vs Suspense Conflict",
					)}
				</h1>
				<p className="text-gray-400">
					{t(
						"pages.suspenseProblemDemo.subtitle",
						"Demonstration of the incompatibility between React Compiler and traditional Suspense patterns",
					)}
				</p>
			</div>

			<DemoNavigation />

			<SuspenseProblemDemo />
		</div>
	);
}

export default SuspenseProblemDemoPage;
