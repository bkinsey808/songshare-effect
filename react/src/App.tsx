import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";

import ErrorBoundary from "./components/ErrorBoundary";
import LanguageDetector from "./components/LanguageDetector";
import LanguageProvider from "./components/LanguageProvider";
import Navigation from "./components/Navigation";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import SongsPage from "./pages/SongsPage";
import SuspenseUsePage from "./pages/SuspenseUsePage";
import UploadPage from "./pages/UploadPage";
import UserPublicSubscriptionPage from "./pages/UserPublicSubscriptionPage";

// Layout component that includes the common layout elements
function Layout(): ReactElement {
	return (
		<ErrorBoundary>
			<div className="mx-auto max-w-6xl p-5 font-sans">
				<header className="mb-10 text-center">
					<h1 className="mb-2 text-4xl font-bold">🎵 SongShare Effect</h1>
					<p className="text-gray-400">
						Share your favorite songs with the world
					</p>
				</header>

				<Navigation />

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
		element: <LanguageDetector />, // NEW: Handles root redirects
	},
	{
		path: "/:lang", // NEW: Language-prefixed routes
		element: <LanguageProvider />, // NEW: Language context + Suspense
		children: [
			{
				path: "",
				element: <Layout />, // MOVED: Under language route
				children: [
					{
						index: true,
						element: <HomePage />, // NOW: /:lang/
					},
					{
						path: "songs",
						element: <SongsPage />, // NOW: /:lang/songs
					},
					{
						path: "upload",
						element: <UploadPage />, // NOW: /:lang/upload
					},
					{
						path: "suspense-use",
						element: <SuspenseUsePage />, // NOW: /:lang/suspense-use
					},
					{
						path: "about",
						element: <AboutPage />, // NOW: /:lang/about
					},
					{
						path: "user-subscription",
						element: <UserPublicSubscriptionPage />, // NOW: /:lang/user-subscription
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
