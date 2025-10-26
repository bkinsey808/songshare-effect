import { Suspense, useEffect } from "react";
import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";

import Navigation from "./Navigation";
import useEnsureSignedIn from "./auth/useEnsureSignedIn";
import ErrorBoundary from "./demo/ErrorBoundary";
import LanguageDetector from "./language/LanguageDetector";
import LanguageProvider from "./language/LanguageProvider";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import OptimizedCounterPage from "./pages/OptimizedCounterPage";
import RegisterPage from "./pages/RegisterPage";
import SuspenseUsePage from "./pages/SuspenseUsePage";
import UploadPage from "./pages/UploadPage";
import UserPublicSubscriptionPage from "./pages/UserPublicSubscriptionPage";
import ActivityDemoPage from "./pages/demo/ActivityDemoPage";
import PopoverDemoPage from "./pages/demo/PopoverDemoPage";
import ReactFeaturesDemoPage from "./pages/demo/ReactFeaturesDemoPage";
import SongsDemoPage from "./pages/demo/SongsDemoPage";
import SuspenseDemoPage from "./pages/demo/SuspenseDemoPage";
import UseHookDemoPage from "./pages/demo/UseHookDemoPage";
import ProtectedLayout from "@/react/auth/ProtectedLayout";
import DashboardPage from "@/react/pages/DashboardPage";
import DeleteAccountConfirmPage from "@/react/pages/DeleteAccountConfirmPage";
import {
	aboutPath,
	activityDemoPath,
	dashboardPath,
	deleteAccountPath,
	hookDemoPath,
	optimizedCounterPath,
	popoverDemoPath,
	reactFeaturesPath,
	registerPath,
	songsDemoPath,
	suspenseDemoPath,
	suspenseUseDemoPath,
	uploadDemoPath,
	userSubscriptionDemoPath,
} from "@/shared/paths";

// Component that uses Suspense for store hydration
function HydratedLayout(): ReactElement {
	// Initialize auth state first so the order of Hooks is stable even
	// when the component suspends during hydration.
	useEnsureSignedIn();

	// Remove the initial hide style injected by index.html now that the app
	// has hydrated and initial auth checks have been run. This ensures we
	// only unhide the UI when React is ready to render the correct route
	// (prevents flashing the wrong page during OAuth redirects).
	// Run in an effect so it's safe to mutate the DOM here.
	useEffect(() => {
		try {
			const el = document.getElementById("songshare-signin-hide");
			if (el) {
				el.remove();
			}
		} catch {
			// ignore
		}
	}, []);

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
		// handle root redirects
		element: <LanguageDetector />,
	},
	{
		// language-prefixed routes
		path: "/:lang",
		// language context + Suspense
		element: <LanguageProvider />,
		children: [
			{
				path: "",
				// under language route
				element: <Layout />,
				children: [
					{
						index: true,
						element: <HomePage />,
					},
					{
						path: registerPath,
						element: <RegisterPage />,
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
						path: dashboardPath,
						element: <ProtectedLayout />,
						children: [
							{
								index: true,
								element: <DashboardPage />,
							},
							{
								path: deleteAccountPath,
								element: <DeleteAccountConfirmPage />,
							},
						],
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
