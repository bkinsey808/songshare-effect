import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

import {
	communityEditPath,
	communityLibraryPath,
	deleteAccountPath,
	eventEditPath,
	eventLibraryPath,
	imageEditPath,
	imageLibraryPath,
	imageUploadPath,
	playlistEditPath,
	playlistLibraryPath,
	songEditPath,
	songLibraryPath,
	tagLibraryPath,
	tagViewPath,
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
const EventEditPage = lazy(() => import("@/react/pages/EventEditPage"));
const EventLibraryPage = lazy(() => import("@/react/pages/EventLibraryPage"));
const ImageLibraryPage = lazy(() => import("@/react/pages/ImageLibraryPage"));
const ImageUploadPage = lazy(() => import("@/react/pages/ImageUploadPage"));
const ImageEditPage = lazy(() => import("@/react/pages/ImageEditPage"));
const CommunityEditPage = lazy(() => import("@/react/pages/CommunityEditPage"));
const CommunityLibraryPage = lazy(() => import("@/react/pages/CommunityLibraryPage"));
const UserLibraryPage = lazy(() => import("@/react/user-library/UserLibraryPage"));
const TagLibraryPage = lazy(() => import("@/react/pages/TagLibraryPage"));
const TagViewPage = lazy(() => import("@/react/pages/TagViewPage"));

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
		path: eventEditPath,
		element: withSuspense(EventEditPage),
	},
	{
		path: `${eventEditPath}/:event_id`,
		element: withSuspense(EventEditPage),
	},
	{
		path: communityEditPath,
		element: withSuspense(CommunityEditPage),
	},
	{
		path: `${communityEditPath}/:community_id`,
		element: withSuspense(CommunityEditPage),
	},
	{
		path: playlistLibraryPath,
		element: withSuspense(PlaylistLibraryPage),
	},
	{
		path: userLibraryPath,
		element: withSuspense(UserLibraryPage),
	},
	{
		path: eventLibraryPath,
		element: withSuspense(EventLibraryPage),
	},
	{
		path: imageLibraryPath,
		element: withSuspense(ImageLibraryPage),
	},
	{
		path: imageUploadPath,
		element: withSuspense(ImageUploadPage),
	},
	{
		path: `${imageEditPath}/:image_id`,
		element: withSuspense(ImageEditPage),
	},
	{
		path: communityLibraryPath,
		element: withSuspense(CommunityLibraryPage),
	},
	{
		path: tagLibraryPath,
		element: withSuspense(TagLibraryPage),
	},
	{
		path: `${tagViewPath}/:tag_slug`,
		element: withSuspense(TagViewPage),
	},
];

export default dashboardRoutes;
