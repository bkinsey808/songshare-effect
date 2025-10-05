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

// Layout component that includes the common layout elements
function Layout(): ReactElement {
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
