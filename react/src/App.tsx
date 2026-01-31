import { Suspense, lazy, type ReactElement } from "react";
import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";

import ProtectedLayout from "@/react/auth/ProtectedLayout";
import Navigation from "@/react/navigation/Navigation";
import useIsScrolled from "@/react/navigation/useIsScrolled";
import { useAppStore } from "@/react/zustand/useAppStore";
import {
	aboutPath,
	activityDemoPath,
	dashboardPath,
	deleteAccountPath,
	hookDemoPath,
	optimizedCounterPath,
	playlistEditPath,
	playlistLibraryPath,
	playlistViewPath,
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
// Lazy load all route pages for better code splitting
// Only HomePage is eagerly loaded as it's the landing page
import HomePage from "./pages/home/HomePage";

// Dashboard and protected routes
const DashboardPage = lazy(() => import("@/react/pages/dashboard/DashboardPage"));
const DeleteAccountConfirmPage = lazy(() => import("@/react/pages/DeleteAccountConfirmPage"));
const SongEditPage = lazy(() => import("@/react/pages/SongEditPage"));
const SongLibraryPage = lazy(() => import("@/react/pages/SongLibraryPage"));
const PlaylistEditPage = lazy(() => import("@/react/pages/PlaylistEditPage"));
const PlaylistLibraryPage = lazy(() => import("@/react/pages/PlaylistLibraryPage"));

// Public pages
const AboutPage = lazy(() => import("./pages/AboutPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const SongView = lazy(() => import("./song/song-view/SongView"));
const PlaylistPage = lazy(() => import("./pages/PlaylistPage"));

// Demo pages
const ActivityDemoPage = lazy(() => import("./pages/demo/ActivityDemoPage"));
const PopoverDemoPage = lazy(() => import("./pages/demo/PopoverDemoPage"));
const ReactFeaturesDemoPage = lazy(() => import("./pages/demo/ReactFeaturesDemoPage"));
const SuspenseDemoPage = lazy(() => import("./pages/demo/SuspenseDemoPage"));
const UseHookDemoPage = lazy(() => import("./pages/demo/UseHookDemoPage"));
const OptimizedCounterPage = lazy(() => import("./pages/OptimizedCounterPage"));
const SuspenseUsePage = lazy(() => import("./pages/SuspenseUsePage"));
const UserPublicSubscriptionPage = lazy(() => import("./pages/UserPublicSubscriptionPage"));
const TypeGpuDemoPage = lazy(() => import("./pages/demo/TypeGpuDemoPage"));
const TypegpuAudioVizDemoPage = lazy(
	() => import("./pages/demo/typegpu-audio-viz/TypegpuAudioVizDemoPage"),
);

// Component that uses Suspense for store hydration
function HydratedLayout(): ReactElement {
	// Initialize auth state first so the order of Hooks is stable even
	// when the component suspends during hydration.
	// useEnsureSignedIn();

	// Use persisted app store for header actions so the toggle state survives refresh
	const isActionsExpanded = useAppStore((state) => state.isHeaderActionsExpanded);
	const setIsActionsExpanded = useAppStore((state) => state.setHeaderActionsExpanded);
	const isScrolled = useIsScrolled();

	return (
		<ErrorBoundary>
			<Navigation
				actionsExpanded={isActionsExpanded}
				onActionsExpandedChange={setIsActionsExpanded}
				isScrolled={isScrolled}
			/>
			<div
				className={`mx-auto max-w-screen-2xl p-5 pt-4 font-sans ${isScrolled ? "pb-36" : "pb-24"}`}
			>
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

// Page loading fallback for route-level code splitting
function PageLoadingFallback(): ReactElement {
	return (
		<div className="flex items-center justify-center py-12">
			<div className="text-center">
				<div className="border-primary-500 mb-4 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
				<p className="text-sm text-gray-400">Loading...</p>
			</div>
		</div>
	);
}

// Helper to wrap lazy components with Suspense
function withSuspense(Component: React.LazyExoticComponent<React.ComponentType>): ReactElement {
	return (
		<Suspense fallback={<PageLoadingFallback />}>
			<Component />
		</Suspense>
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
						element: withSuspense(RegisterPage),
					},
					{
						path: uploadDemoPath,
						element: withSuspense(UploadPage),
					},
					{
						path: suspenseUseDemoPath,
						element: withSuspense(SuspenseUsePage),
					},
					{
						path: suspenseDemoPath,
						element: withSuspense(SuspenseDemoPage),
					},
					{
						path: hookDemoPath,
						element: withSuspense(UseHookDemoPage),
					},
					{
						path: optimizedCounterPath,
						element: withSuspense(OptimizedCounterPage),
					},
					{
						path: dashboardPath,
						element: <ProtectedLayout />,
						children: [
							{
								index: true,
								element: withSuspense(DashboardPage),
							},
							{
								path: deleteAccountPath,
								element: withSuspense(DeleteAccountConfirmPage),
							},
							{
								path: songEditPath,
								element: withSuspense(SongEditPage),
							},
							{
								path: `${songEditPath}/:song_id`,
								element: withSuspense(SongEditPage),
							},
							{
								path: songLibraryPath,
								element: withSuspense(SongLibraryPage),
							},
							{
								path: playlistEditPath,
								element: withSuspense(PlaylistEditPage),
							},
							{
								path: `${playlistEditPath}/:playlist_id`,
								element: withSuspense(PlaylistEditPage),
							},
							{
								path: playlistLibraryPath,
								element: withSuspense(PlaylistLibraryPage),
							},
						],
					},
					{
						path: `${songViewPath}/:song_slug`,
						element: withSuspense(SongView),
					},
					{
						path: `${playlistViewPath}/:playlist_slug`,
						element: withSuspense(PlaylistPage),
					},
					{
						path: reactFeaturesPath,
						element: withSuspense(ReactFeaturesDemoPage),
					},
					{
						path: aboutPath,
						element: withSuspense(AboutPage),
					},
					{
						path: userSubscriptionDemoPath,
						element: withSuspense(UserPublicSubscriptionPage),
					},
					{
						path: popoverDemoPath,
						element: withSuspense(PopoverDemoPage),
					},
					{
						path: activityDemoPath,
						element: withSuspense(ActivityDemoPage),
					},
					{
						path: typegpuDemoPath,
						element: withSuspense(TypeGpuDemoPage),
					},
					{
						path: typegpuAudioVizDemoPath,
						element: withSuspense(TypegpuAudioVizDemoPage),
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
