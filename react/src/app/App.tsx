import { Suspense, type ReactElement } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import appRoutes from "../routes/appRoutes";

function App(): ReactElement {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<RouterProvider router={createBrowserRouter(appRoutes)} />
		</Suspense>
	);
}

export default App;
