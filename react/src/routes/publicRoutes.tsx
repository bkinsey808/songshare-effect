import type { RouteObject } from "react-router-dom";

import { lazy } from "react";

import {
	aboutPath,
	activityDemoPath,
	eventManagePath,
	eventSlideShowPath,
	eventViewPath,
	hookDemoPath,
	optimizedCounterPath,
	playlistViewPath,
	popoverDemoPath,
	reactFeaturesPath,
	registerPath,
	songViewPath,
	suspenseDemoPath,
	suspenseUseDemoPath,
	typegpuAudioVizDemoPath,
	typegpuDemoPath,
	uploadDemoPath,
	userPublicSubscriptionPath,
	userSubscriptionDemoPath,
} from "@/shared/paths";

import withSuspense from "../app/withSuspense";
import HomePage from "../pages/home/HomePage";

// Lazy-loaded route components for public routes
const AboutPage = lazy(() => import("../pages/AboutPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const UploadPage = lazy(() => import("../pages/UploadPage"));
const SongView = lazy(() => import("../song/song-view/SongView"));
const PlaylistPage = lazy(() => import("../pages/PlaylistPage"));
const EventView = lazy(() => import("../event/view/EventView"));
const EventManageView = lazy(() => import("../event/manage/EventManageView"));
const EventSlideShowView = lazy(() => import("../event/view/EventSlideShowView"));
const ActivityDemoPage = lazy(() => import("../pages/demo/ActivityDemoPage"));
const PopoverDemoPage = lazy(() => import("../pages/demo/PopoverDemoPage"));
const ReactFeaturesDemoPage = lazy(() => import("../pages/demo/ReactFeaturesDemoPage"));
const SuspenseDemoPage = lazy(() => import("../pages/demo/SuspenseDemoPage"));
const UseHookDemoPage = lazy(() => import("../pages/demo/UseHookDemoPage"));
const OptimizedCounterPage = lazy(() => import("../pages/OptimizedCounterPage"));
const SuspenseUsePage = lazy(() => import("../pages/SuspenseUsePage"));
const UserPublicSubscriptionPage = lazy(
	() => import("../pages/demo/user-public-subscription/UserPublicSubscriptionPage"),
);
const TypeGpuDemoPage = lazy(() => import("../pages/demo/TypeGpuDemoPage"));
const TypegpuAudioVizDemoPage = lazy(
	() => import("../pages/demo/typegpu-audio-viz/TypegpuAudioVizDemoPage"),
);

/**
 * Public route definitions that should render without the hydrated layout.
 */
export const publicRoutesWithoutLayout: RouteObject[] = [
	{
		path: `${eventViewPath}/:event_slug/${eventSlideShowPath}`,
		element: withSuspense(EventSlideShowView),
	},
];

/**
 * Public route definitions that live under the language-prefixed root.
 *
 * These routes render inside the hydrated app layout.
 * Lazy load all route pages for better code splitting
 * Only HomePage is eagerly loaded as it's the landing page
 */
export const publicRoutesWithLayout: RouteObject[] = [
	{
		index: true,
		element: <HomePage />,
	},
	{
		path: registerPath,
		element: withSuspense(RegisterPage),
	},
	{
		path: uploadDemoPath,
		element: withSuspense(UploadPage),
	},
	{
		path: suspenseUseDemoPath,
		element: withSuspense(SuspenseUsePage),
	},
	{
		path: suspenseDemoPath,
		element: withSuspense(SuspenseDemoPage),
	},
	{
		path: hookDemoPath,
		element: withSuspense(UseHookDemoPage),
	},
	{
		path: optimizedCounterPath,
		element: withSuspense(OptimizedCounterPage),
	},
	{
		path: `${songViewPath}/:song_slug`,
		element: withSuspense(SongView),
	},
	{
		path: `${playlistViewPath}/:playlist_slug`,
		element: withSuspense(PlaylistPage),
	},
	{
		path: `${eventViewPath}/:event_slug`,
		element: withSuspense(EventView),
	},
	{
		path: `${eventViewPath}/:event_slug/${eventManagePath}`,
		element: withSuspense(EventManageView),
	},
	{
		path: reactFeaturesPath,
		element: withSuspense(ReactFeaturesDemoPage),
	},
	{
		path: aboutPath,
		element: withSuspense(AboutPage),
	},
	{
		path: userSubscriptionDemoPath,
		element: withSuspense(UserPublicSubscriptionPage),
	},
	{
		path: userPublicSubscriptionPath,
		element: withSuspense(UserPublicSubscriptionPage),
	},
	{
		path: popoverDemoPath,
		element: withSuspense(PopoverDemoPage),
	},
	{
		path: activityDemoPath,
		element: withSuspense(ActivityDemoPage),
	},
	{
		path: typegpuDemoPath,
		element: withSuspense(TypeGpuDemoPage),
	},
	{
		path: typegpuAudioVizDemoPath,
		element: withSuspense(TypegpuAudioVizDemoPage),
	},
];
