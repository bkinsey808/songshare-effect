import { Suspense } from "react";
import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import type { StoreApi, UseBoundStore } from "zustand";

import ErrorBoundary from "./components/ErrorBoundary";
import Navigation from "./components/Navigation";
import LanguageDetector from "./language/LanguageDetector";
import LanguageProvider from "./language/LanguageProvider";
import AboutPage from "./pages/AboutPage";
import ActivityDemoPage from "./pages/ActivityDemoPage";
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
import {
	type AppSlice,
	useAppStoreHydrated,
	useAppStoreHydrationPromise,
} from "./zustand/useAppStore";
import {
	aboutPath,
	activityDemoPath,
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

// ✅ IDEAL SOLUTION: Suspense-compatible hook using direct hydration promise
function useAppStoreSuspense(): UseBoundStore<StoreApi<AppSlice>> {
	const { store, isHydrated } = useAppStoreHydrated();
	// Always call the hook - Rules of Hooks
	const hydrationPromise = useAppStoreHydrationPromise();

	if (!isHydrated) {
		// Throw the actual hydration promise for Suspense to catch
		throw hydrationPromise;
	}

	return store;
}

// Component that uses Suspense for store hydration
function HydratedLayout(): ReactElement {
	// This will suspend until the store is hydrated
	useAppStoreSuspense();

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

// Loading fallback component for Suspense
function AppLoadingFallback(): ReactElement {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-900">
			<div className="text-center">
				<div className="border-primary-500 mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
				<p className="text-gray-300">Loading app...</p>
			</div>
		</div>
	);
}

// Layout component with Suspense for store hydration
function Layout(): ReactElement {
	return (
		<Suspense fallback={<AppLoadingFallback />}>
			<HydratedLayout />
		</Suspense>
	);
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
					{
						path: activityDemoPath,
						element: <ActivityDemoPage />,
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
