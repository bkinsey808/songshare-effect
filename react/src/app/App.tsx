import { Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import appRoutes from "../routes/appRoutes";

/**
 * Render the root application router.
 *
 * Renders the application router inside a React `Suspense` boundary so that
 * route-level lazy components can display a fallback while loading.
 *
 * @returns ReactElement.
 */
function App(): ReactElement {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<RouterProvider router={createBrowserRouter(appRoutes)} />
		</Suspense>
	);
}

export default App;
