import type { RouteObject } from "react-router-dom";

import RequireAuthBoundary from "@/react/auth/boundary/RequireAuthBoundary";
import { dashboardPath } from "@/shared/paths";

import AppHydrationBoundary from "../app/AppHydrationBoundary";
import LanguageDetector from "../lib/language/detector/LanguageDetector";
import LanguageProvider from "../lib/language/provider/LanguageProvider";
import dashboardRoutes from "./dashboardRoutes";
import publicRoutes from "./publicRoutes";

/**
 * Application route configuration used by the router.
 *
 * - Root "/" routes to `LanguageDetector` which handles root redirects.
 * - "/:lang" wraps language-prefixed routes with `LanguageProvider`.
 * - The `Layout` contains `publicRoutes` and a protected dashboard route.
 * - Dashboard uses `RequireAuthBoundary` and `dashboardRoutes`.
 */
const appRoutes: RouteObject[] = [
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
				element: <AppHydrationBoundary />,
				children: [
					...publicRoutes,
					{
						path: dashboardPath,
						element: <RequireAuthBoundary />,
						children: dashboardRoutes,
					},
				],
			},
		],
	},
];

export default appRoutes;
