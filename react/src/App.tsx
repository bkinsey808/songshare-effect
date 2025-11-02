import { Suspense, useEffect } from "react";
import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";

import Navigation from "./Navigation";
import useEnsureSignedIn, { ensureSignedIn } from "./auth/useEnsureSignedIn";
import useSignIn from "./auth/useSignIn";
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

	// Remove the initial hide style injected by index.html only after
	// the app has had a chance to determine authentication state. We
	// rely on the `useSignIn` hook to know whether sign-in is pending or
	// whether the signed-in state has been resolved. This reduces the
	// chance of a flash during OAuth redirect flows by keeping the UI
	// hidden until auth is settled.
	const { isSignedIn, signinPending } = useSignIn();

	// Debug flag: set window.__SONGSHARE_DEBUG__ = true in the browser
	// or set VITE_SONGSHARE_DEBUG=true at build time to enable these logs.
	// Disabled by default; enable in-browser by setting window.__SONGSHARE_DEBUG__ = true
	// or at build time via VITE_SONGSHARE_DEBUG=true. Keep false here to avoid transform/lint issues.
	useEffect(() => {
		// Compute the removal condition outside the try/catch to avoid
		// transforming complex expressions inside the try block.
		function delay(ms: number): Promise<void> {
			return new Promise<void>((resolve) => setTimeout(resolve, ms));
		}

		const shouldRemoveHide =
			isSignedIn !== undefined || signinPending === false;

		const dbg = Boolean(
			(globalThis as unknown as { __SONGSHARE_DEBUG__?: boolean })
				.__SONGSHARE_DEBUG__,
		);
		if (dbg) {
			// eslint-disable-next-line no-console
			console.log("[songshare-debug] shouldRemoveHide computed", {
				t: performance.now(),
				shouldRemoveHide,
				isSignedIn,
				signinPending,
			});
		}

		let removed = false;

		async function maybeWaitForAuthAndRemove(): Promise<void> {
			// Evaluate complex boolean outside the try block to avoid
			// Babel/react-compiler transform limitations on value blocks.
			const waitForAuth = !shouldRemoveHide && signinPending;

			async function waitForAuthResult(): Promise<boolean> {
				if (dbg) {
					// eslint-disable-next-line no-console
					console.log(
						"[songshare-debug] waiting for ensureSignedIn with timeout",
						{ t: performance.now() },
					);
				}
				const maxWaitMs = 2500;
				const pollInterval = 250;
				const start = Date.now();

				// Trigger an immediate check
				void ensureSignedIn({ force: true });

				// Poll by calling ensureSignedIn repeatedly until we see
				// a positive result or the timeout expires.
				while (Date.now() - start < maxWaitMs) {
					try {
						const data = await ensureSignedIn({ force: true });
						if (data !== undefined) {
							return true;
						}
					} catch {
						// ignore transient errors and continue polling
					}
					await delay(pollInterval);
				}
				// (debug) poll result logged elsewhere
				return false;
			}

			try {
				if (waitForAuth) {
					await waitForAuthResult();
				}

				const el = document.getElementById("songshare-signin-hide");
				if (el) {
					if (dbg) {
						// eslint-disable-next-line no-console
						console.log("[songshare-debug] removing hide element", {
							t: performance.now(),
						});
					}
					el.remove();
					removed = true;
				}
			} catch {
				// ignore DOM errors
			}
		}

		// Only run the async wait if we didn't already decide to remove immediately
		if (shouldRemoveHide) {
			try {
				const el = document.getElementById("songshare-signin-hide");
				if (el) {
					if (dbg) {
						// eslint-disable-next-line no-console
						console.log("[songshare-debug] removing hide element immediately", {
							t: performance.now(),
						});
					}
					el.remove();
					removed = true;
				}
			} catch {
				// ignore
			}
		} else if (!removed) {
			void maybeWaitForAuthAndRemove();
		}

		return () => {
			// nothing to cleanup; effect dependencies control re-run
		};
	}, [isSignedIn, signinPending]);

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
