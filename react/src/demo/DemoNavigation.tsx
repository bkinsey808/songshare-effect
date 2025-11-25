import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import {
	activityDemoPath,
	hookDemoPath,
	optimizedCounterPath,
	reactFeaturesPath,
	songsDemoPath,
	suspenseDemoPath,
	suspenseUseDemoPath,
	uploadDemoPath,
	userSubscriptionDemoPath,
} from "@/shared/paths";

function DemoNavigation(): ReactElement {
	const { t, i18n } = useTranslation();
	const currentLang = i18n.language;

	const demoNavItems = [
		{
			path: reactFeaturesPath,
			labelKey: "navigation.reactFeatures",
			icon: "🚀",
		},
		{ path: songsDemoPath, labelKey: "navigation.songs", icon: "🎵" },
		{ path: uploadDemoPath, labelKey: "navigation.upload", icon: "📤" },
		{
			path: optimizedCounterPath,
			labelKey: "navigation.optimizedCounter",
			icon: "⚡",
		},
		{
			path: suspenseDemoPath,
			labelKey: "navigation.suspense",
			icon: "⏳",
		},
		{
			path: hookDemoPath,
			labelKey: "navigation.useHook",
			icon: "🪝",
		},
		{
			path: suspenseUseDemoPath,
			labelKey: "navigation.suspenseUse",
			icon: "🚡",
		},
		{
			path: userSubscriptionDemoPath,
			labelKey: "navigation.userSubscription",
			icon: "👥",
		},
		{
			path: activityDemoPath,
			labelKey: "navigation.activity",
			icon: "⚡",
		},
	];

	return (
		<nav className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4">
			<div className="mb-4 text-center">
				<h3 className="text-lg font-semibold text-white">
					🎯 {t("navigation.demoSection", "Demo Navigation")}
				</h3>
				<p className="text-sm text-gray-400">
					{t(
						"navigation.demoDescription",
						"Quick access to all demonstrations",
					)}
				</p>
			</div>

			<div className="flex flex-wrap justify-center gap-3">
				{demoNavItems.map((item) => (
					<Link
						key={item.path}
						to={`/${currentLang}/${item.path}`}
						className="hover:border-primary-500 flex cursor-pointer items-center gap-2 rounded-lg border border-gray-600 bg-transparent px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-700"
					>
						<span>{item.icon}</span>
						<span>{t(item.labelKey)}</span>
					</Link>
				))}
			</div>
		</nav>
	);
}

export default DemoNavigation;
