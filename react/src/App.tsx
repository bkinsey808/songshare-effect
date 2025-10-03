import { useTranslation } from "react-i18next";
import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";

import ErrorBoundary from "./components/ErrorBoundary";
import Navigation from "./components/Navigation";
import LanguageDetector from "./language/LanguageDetector";
import LanguageProvider from "./language/LanguageProvider";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import SongsDemoPage from "./pages/SongsDemoPage";
import SuspenseUsePage from "./pages/SuspenseUsePage";
import UploadPage from "./pages/UploadPage";
import UserPublicSubscriptionPage from "./pages/UserPublicSubscriptionPage";

// Layout component that includes the common layout elements
function Layout(): ReactElement {
	const { t } = useTranslation();

	return (
		<ErrorBoundary>
			<div className="mx-auto max-w-6xl p-5 font-sans">
				<header className="mb-10 text-center">
					<h1 className="mb-2 text-4xl font-bold">🎵 {t("app.title")}</h1>
					<p className="text-gray-400">{t("app.subtitle")}</p>
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
						path: "songs",
						element: <SongsDemoPage />,
					},
					{
						path: "upload",
						element: <UploadPage />,
					},
					{
						path: "suspense-use",
						element: <SuspenseUsePage />,
					},
					{
						path: "about",
						element: <AboutPage />,
					},
					{
						path: "user-subscription",
						element: <UserPublicSubscriptionPage />,
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
