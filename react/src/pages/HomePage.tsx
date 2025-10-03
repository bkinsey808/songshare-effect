import { Suspense } from "react";
import { useTranslation } from "react-i18next";

import OptimizedCounter from "../components/OptimizedCounter";
import SuspenseDemo from "../components/SuspenseDemo";
import UseHookDemo from "../components/UseHookDemo";

function HomePage(): ReactElement {
	const { t } = useTranslation();

	return (
		<div>
			<div className="mb-10 text-center">
				<h2 className="mb-4 text-3xl font-bold">🏠 {t("pages.home.title")}</h2>
				<p className="text-gray-400">{t("pages.home.subtitle")}</p>
			</div>

			<OptimizedCounter />
			<SuspenseDemo />

			<Suspense
				fallback={
					<div className="p-5 text-center">Loading Use Hook Demo...</div>
				}
			>
				<UseHookDemo />
			</Suspense>

			<div className="mt-10 text-center">
				<button className="bg-primary-500 hover:bg-primary-600 cursor-pointer rounded-lg border-none px-8 py-4 text-lg text-white transition-colors">
					📁 Upload Song
				</button>
			</div>
		</div>
	);
}

export default HomePage;
