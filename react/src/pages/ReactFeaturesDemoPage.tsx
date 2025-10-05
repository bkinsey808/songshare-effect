import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import DemoNavigation from "../components/DemoNavigation";
import type { SupportedLanguage } from "@/shared/language/supportedLanguages";
import {
	hookDemoPath,
	optimizedCounterPath,
	popoverDemoPath,
	suspenseDemoPath,
	suspenseUseDemoPath,
	uploadDemoPath,
} from "@/shared/paths";

function ReactFeaturesDemoPage(): ReactElement {
	const { t, i18n } = useTranslation();
	const currentLang = i18n.language as SupportedLanguage;

	return (
		<div>
			<div className="mb-10 text-center">
				<h1 className="mb-4 text-4xl font-bold">
					🚀 {t("pages.reactFeatures.title", "React Features Demo")}
				</h1>
				<p className="text-gray-400">
					{t(
						"pages.reactFeatures.subtitle",
						"Explore various React features and performance optimization techniques through interactive demonstrations",
					)}
				</p>
			</div>

			<DemoNavigation />

			<div className="my-12 space-y-6">
				<h2 className="text-center text-2xl font-bold">
					Interactive Demonstrations
				</h2>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					<div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
						<div className="mb-4 text-4xl">⚡</div>
						<h3 className="mb-3 text-xl font-semibold">Optimized Counter</h3>
						<p className="mb-4 text-gray-400">
							Performance optimization techniques with React.memo, useCallback,
							and useMemo
						</p>
						<Link
							to={`/${currentLang}/${optimizedCounterPath}`}
							className="inline-block cursor-pointer rounded-lg border-none bg-yellow-500 px-6 py-3 text-white transition-colors hover:bg-yellow-600"
						>
							View Demo
						</Link>
					</div>

					<div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
						<div className="mb-4 text-4xl">🔄</div>
						<h3 className="mb-3 text-xl font-semibold">Suspense Demo</h3>
						<p className="mb-4 text-gray-400">
							Interactive demonstration of React Suspense with promise-based
							data fetching
						</p>
						<Link
							to={`/${currentLang}/${suspenseDemoPath}`}
							className="inline-block cursor-pointer rounded-lg border-none bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600"
						>
							View Demo
						</Link>
					</div>

					<div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
						<div className="mb-4 text-4xl">🔀</div>
						<h3 className="mb-3 text-xl font-semibold">Use Hook Demo</h3>
						<p className="mb-4 text-gray-400">
							Explore the new React 'use' hook for reading promises and context
							values
						</p>
						<Link
							to={`/${currentLang}/${hookDemoPath}`}
							className="inline-block cursor-pointer rounded-lg border-none bg-purple-500 px-6 py-3 text-white transition-colors hover:bg-purple-600"
						>
							View Demo
						</Link>
					</div>

					<div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
						<div className="mb-4 text-4xl">⚡</div>
						<h3 className="mb-3 text-xl font-semibold">Advanced Suspense</h3>
						<p className="mb-4 text-gray-400">
							Complex Suspense patterns with error boundaries and concurrent
							features
						</p>
						<Link
							to={`/${currentLang}/${suspenseUseDemoPath}`}
							className="inline-block cursor-pointer rounded-lg border-none bg-green-500 px-6 py-3 text-white transition-colors hover:bg-green-600"
						>
							View Demo
						</Link>
					</div>

					<div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
						<div className="mb-4 text-4xl">📁</div>
						<h3 className="mb-3 text-xl font-semibold">Upload Demo</h3>
						<p className="mb-4 text-gray-400">
							File upload functionality with progress tracking and error
							handling
						</p>
						<Link
							to={`/${currentLang}/${uploadDemoPath}`}
							className="inline-block cursor-pointer rounded-lg border-none bg-indigo-500 px-6 py-3 text-white transition-colors hover:bg-indigo-600"
						>
							View Demo
						</Link>
					</div>

					<div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
						<div className="mb-4 text-4xl">💬</div>
						<h3 className="mb-3 text-xl font-semibold">Popover Demo</h3>
						<p className="mb-4 text-gray-400">
							Modern web UI popovers including native Popover API and custom
							implementations
						</p>
						<Link
							to={`/${currentLang}/${popoverDemoPath}`}
							className="inline-block cursor-pointer rounded-lg border-none bg-teal-500 px-6 py-3 text-white transition-colors hover:bg-teal-600"
						>
							View Demo
						</Link>
					</div>
				</div>
			</div>

			<div className="mt-12 rounded-lg border border-blue-500/20 bg-blue-500/10 p-6">
				<h3 className="mb-4 text-lg font-semibold text-blue-300">
					💡 What You'll Learn:
				</h3>
				<div className="grid grid-cols-1 gap-4 text-sm text-blue-200 md:grid-cols-2">
					<div>
						<h4 className="mb-2 font-semibold">Performance Optimization:</h4>
						<ul className="list-inside list-disc space-y-1">
							<li>React.memo for preventing re-renders</li>
							<li>useCallback for memoizing functions</li>
							<li>useMemo for expensive calculations</li>
							<li>Component splitting strategies</li>
						</ul>
					</div>
					<div>
						<h4 className="mb-2 font-semibold">Modern React Patterns:</h4>
						<ul className="list-inside list-disc space-y-1">
							<li>Suspense for data fetching</li>
							<li>Error boundaries for fault tolerance</li>
							<li>The new 'use' hook</li>
							<li>Concurrent rendering features</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ReactFeaturesDemoPage;
