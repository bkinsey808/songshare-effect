import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";

import ErrorBoundary from "./components/ErrorBoundary";
import Navigation from "./components/Navigation";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import SongsPage from "./pages/SongsPage";
import SuspenseUsePage from "./pages/SuspenseUsePage";
import UploadPage from "./pages/UploadPage";

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

// Create the router with the new v7 API
const router = createBrowserRouter([
	{
		path: "/",
		element: <Layout />,
		children: [
			{
				index: true,
				element: <HomePage />,
			},
			{
				path: "songs",
				element: <SongsPage />,
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
		],
	},
]);

function App(): ReactElement {
	return <RouterProvider router={router} />;
}

export default App;
