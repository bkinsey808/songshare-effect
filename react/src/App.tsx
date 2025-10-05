import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";

import ErrorBoundary from "./components/ErrorBoundary";
import Navigation from "./components/Navigation";
import LanguageDetector from "./language/LanguageDetector";
import LanguageProvider from "./language/LanguageProvider";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import OptimizedCounterPage from "./pages/OptimizedCounterPage";
import PopoverDemoPage from "./pages/PopoverDemoPage";
import ReactFeaturesDemoPage from "./pages/ReactFeaturesDemoPage";
import SongsDemoPage from "./pages/SongsDemoPage";
import SuspenseDemoPage from "./pages/SuspenseDemoPage";
import SuspenseUsePage from "./pages/SuspenseUsePage";
import UploadPage from "./pages/UploadPage";
import UseHookDemoPage from "./pages/UseHookDemoPage";
import UserPublicSubscriptionPage from "./pages/UserPublicSubscriptionPage";
import { useAppStoreHydrated } from "./zustand/useAppStore";
import {
	aboutPath,
	hookDemoPath,
	optimizedCounterPath,
	popoverDemoPath,
	reactFeaturesPath,
	songsDemoPath,
	suspenseDemoPath,
	suspenseUseDemoPath,
	uploadDemoPath,
	userSubscriptionDemoPath,
} from "@/shared/paths";

// Component that waits for store hydration
function HydratedLayout(): ReactElement {
	const { isHydrated } = useAppStoreHydrated();

	// Show loading screen until store is hydrated
	if (!isHydrated) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-900">
				<div className="text-center">
					<div className="border-primary-500 mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
					<p className="text-gray-300">Loading app...</p>
				</div>
			</div>
		);
	}

	return (
		<ErrorBoundary>
			<Navigation />
			<div className="mx-auto max-w-6xl p-5 pt-[200px] font-sans">
				<main>
					<Outlet />
				</main>
			</div>
		</ErrorBoundary>
	);
}

// Layout component - simple conditional rendering
function Layout(): ReactElement {
	return <HydratedLayout />;
}

// Create the router with language support
const router = createBrowserRouter([
	{
		path: "/",
		element: <LanguageDetector />, // handle root redirects
	},
	{
		path: "/:lang", // language-prefixed routes
		element: <LanguageProvider />, // language context + Suspense
		children: [
			{
				path: "",
				element: <Layout />, // under language route
				children: [
					{
						index: true,
						element: <HomePage />,
					},
					{
						path: songsDemoPath,
						element: <SongsDemoPage />,
					},
					{
						path: uploadDemoPath,
						element: <UploadPage />,
					},
					{
						path: suspenseUseDemoPath,
						element: <SuspenseUsePage />,
					},
					{
						path: suspenseDemoPath,
						element: <SuspenseDemoPage />,
					},
					{
						path: hookDemoPath,
						element: <UseHookDemoPage />,
					},
					{
						path: optimizedCounterPath,
						element: <OptimizedCounterPage />,
					},
					{
						path: reactFeaturesPath,
						element: <ReactFeaturesDemoPage />,
					},
					{
						path: aboutPath,
						element: <AboutPage />,
					},
					{
						path: userSubscriptionDemoPath,
						element: <UserPublicSubscriptionPage />,
					},
					{
						path: popoverDemoPath,
						element: <PopoverDemoPage />,
					},
				],
			},
		],
	},
]);

function App(): ReactElement {
	return <RouterProvider router={router} />;
}

export default App;
