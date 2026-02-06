import type { RouteObject } from "react-router-dom";

import { lazy } from "react";

import {
	deleteAccountPath,
	playlistEditPath,
	playlistLibraryPath,
	songEditPath,
	songLibraryPath,
	userLibraryPath,
} from "@/shared/paths";

import withSuspense from "../app/withSuspense";

// Lazy route pages for dashboard
const DashboardPage = lazy(() => import("@/react/pages/dashboard/DashboardPage"));
const DeleteAccountConfirmPage = lazy(() => import("@/react/pages/DeleteAccountConfirmPage"));
const SongEditPage = lazy(() => import("@/react/pages/SongEditPage"));
const SongLibraryPage = lazy(() => import("@/react/pages/SongLibraryPage"));
const PlaylistEditPage = lazy(() => import("@/react/pages/PlaylistEditPage"));
const PlaylistLibraryPage = lazy(() => import("@/react/pages/PlaylistLibraryPage"));
const UserLibraryPage = lazy(() => import("@/react/user-library/UserLibraryPage"));

/**
 * Dashboard route configuration used by the app router.
 *
 * - Lazy-loads dashboard pages and wraps them with `withSuspense` to show
 *   fallbacks while loading.
 * - Includes the index dashboard route, account deletion, song and playlist
 *   edit routes (with optional `:song_id` / `:playlist_id` params), and the
 *   various library pages.
 *
 * Exported as a `RouteObject[]` for inclusion under the protected
 * dashboard branch in the application routes.
 */
const dashboardRoutes: RouteObject[] = [
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
	{
		path: userLibraryPath,
		element: withSuspense(UserLibraryPage),
	},
];

export default dashboardRoutes;
