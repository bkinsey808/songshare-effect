import { Suspense, lazy, type ReactElement } from "react";
import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";

import ProtectedLayout from "@/react/auth/ProtectedLayout";
import DashboardPage from "@/react/pages/dashboard/DashboardPage";
import DeleteAccountConfirmPage from "@/react/pages/DeleteAccountConfirmPage";
import SongEditPage from "@/react/pages/SongEditPage";
import SongLibraryPage from "@/react/pages/SongLibraryPage";
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
	songEditPath,
	songLibraryPath,
	songViewPath,
	suspenseDemoPath,
	suspenseUseDemoPath,
	typegpuAudioVizDemoPath,
	typegpuDemoPath,
	uploadDemoPath,
	userSubscriptionDemoPath,
} from "@/shared/paths";

import ErrorBoundary from "./demo/ErrorBoundary";
import LanguageDetector from "./language/detector/LanguageDetector";
import LanguageProvider from "./language/provider/LanguageProvider";
import Navigation from "./Navigation";
import AboutPage from "./pages/AboutPage";
import ActivityDemoPage from "./pages/demo/ActivityDemoPage";
import PopoverDemoPage from "./pages/demo/PopoverDemoPage";
import ReactFeaturesDemoPage from "./pages/demo/ReactFeaturesDemoPage";
import SuspenseDemoPage from "./pages/demo/SuspenseDemoPage";
import UseHookDemoPage from "./pages/demo/UseHookDemoPage";
import HomePage from "./pages/home/HomePage";
import OptimizedCounterPage from "./pages/OptimizedCounterPage";
import RegisterPage from "./pages/RegisterPage";
import SuspenseUsePage from "./pages/SuspenseUsePage";
import UploadPage from "./pages/UploadPage";
import UserPublicSubscriptionPage from "./pages/UserPublicSubscriptionPage";
import SongView from "./song/song-view/SongView";

const TypeGpuDemoPage = lazy(() => import("./pages/demo/TypeGpuDemoPage"));
const TypegpuAudioVizDemoPage = lazy(
	() => import("./pages/demo/typegpu-audio-viz/TypegpuAudioVizDemoPage"),
);

// Component that uses Suspense for store hydration
function HydratedLayout(): ReactElement {
	// Initialize auth state first so the order of Hooks is stable even
	// when the component suspends during hydration.
	// useEnsureSignedIn();

	return (
		<ErrorBoundary>
			<Navigation />
			<div className="mx-auto max-w-screen-2xl p-5 pt-[200px] pb-24 font-sans">
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
				<div className="border-primary-500 mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
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
							{
								path: songEditPath,
								element: <SongEditPage />,
							},
							{
								path: `${songEditPath}/:song_id`,
								element: <SongEditPage />,
							},
							{
								path: songLibraryPath,
								element: <SongLibraryPage />,
							},
						],
					},
					{
						path: `${songViewPath}/:song_slug`,
						element: <SongView />,
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
					{
						path: typegpuDemoPath,
						element: (
							<Suspense fallback={<div>Loading TypeGPU demo...</div>}>
								<TypeGpuDemoPage />
							</Suspense>
						),
					},
					{
						path: typegpuAudioVizDemoPath,
						element: (
							<Suspense fallback={<div>Loading TypeGPU audio viz demo...</div>}>
								<TypegpuAudioVizDemoPage />
							</Suspense>
						),
					},
				],
			},
		],
	},
]);

function App(): ReactElement {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<RouterProvider router={router} />
		</Suspense>
	);
}

export default App;
