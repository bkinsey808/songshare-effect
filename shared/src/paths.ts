export const songsDemoPath = "songs-demo";
export const uploadDemoPath = "upload-demo";
export const suspenseUseDemoPath = "suspense-use-demo";
export const suspenseDemoPath = "suspense-demo";
export const hookDemoPath = "use-hook-demo";
export const optimizedCounterPath = "optimized-counter";
export const reactFeaturesPath = "react-features";
export const aboutPath = "about";
export const userSubscriptionDemoPath = "user-subscription-demo";
export const userPublicSubscriptionPath = "demo/user-public-subscription";
export const popoverDemoPath = "popover-demo";
export const activityDemoPath = "activity-demo";
export const typegpuDemoPath = "typegpu-demo";
export const typegpuAudioVizDemoPath = "typegpu-audio-viz-demo";

export const dashboardPath = "dashboard";
export const registerPath = "register";
export const songEditPath = "song-edit";
export const songLibraryPath = "song-library";

/** Base path for viewing a song by slug; use as "song/:song_slug" in routes */
export const songViewPath = "song";

// Playlist paths
export const playlistEditPath = "playlist-edit";
export const playlistLibraryPath = "playlist-library";
export const userLibraryPath = "user-library";
export const shareLibraryPath = "share-library";

/** Base path for viewing a playlist by slug; use as "playlist/:playlist_slug" in routes */
export const playlistViewPath = "playlist";

// Event paths
export const eventEditPath = "event-edit";
export const eventLibraryPath = "event-library";

/** Base path for viewing an event by slug; use as "event/:event_slug" in routes */
export const eventViewPath = "event";

/** Suffix path for event manager view; use as "event/:event_slug/manage" */
export const eventManagePath = "manage";

/** Suffix path for event slide show view; use as "event/:event_slug/slideshow" */
export const eventSlideShowPath = "slideshow";

/**
 * Suffix path for event slide *manager* view; use as "event/:event_slug/slide-manager"
 */
export const eventSlideManagerPath = "slide-manager";

// Community paths
export const communityEditPath = "community-edit";
export const communityLibraryPath = "community-library";

/** Base path for viewing a community by slug; use as "community/:community_slug" in routes */
export const communityViewPath = "community";

/** Base path for viewing a user by username; use as "user/:username" in routes */
export const userViewPath = "user";

/** Suffix path for community manager view; use as "community/:community_slug/manage" */
export const communityManagePath = "manage";

export const apiOauthSignInPath = "/api/oauth/sign-in";
export const apiOauthCallbackPath = "/api/oauth/callback";
export const apiMePath = "/api/me";
export const apiAccountRegisterPath = "/api/account/register";
export const apiAccountDeletePath = "/api/account/delete";
export const apiUserTokenPath = "/api/auth/user/token";
export const apiAuthVisitorPath = "/api/auth/visitor";
export const apiAuthSignOutPath = "/api/auth/signout";
export const apiUserSlideOrientationPreferencePath = "/api/user/slide-orientation-preference";
export const apiUserSlideNumberPreferencePath = "/api/user/slide-number-preference";
export const apiUserChordDisplayModePath = "/api/user/chord-display-mode";
export const apiSongsSavePath = "/api/songs/save";
export const apiSongsDeletePath = "/api/songs/delete";
export const apiSongLibraryAddPath = "/api/song-library/add";
export const apiSongLibraryRemovePath = "/api/song-library/remove";
export const apiPlaylistSavePath = "/api/playlists/save";
export const apiPlaylistDeletePath = "/api/playlists/delete";
export const apiPlaylistLibraryAddPath = "/api/playlist-library/add";
export const apiPlaylistLibraryRemovePath = "/api/playlist-library/remove";
export const apiUserLibraryAddPath = "/api/user-library/add";
export const apiUserLibraryRemovePath = "/api/user-library/remove";
export const apiUserLibraryLookupPath = "/api/user-library/lookup";
export const apiEventSavePath = "/api/events/save";
export const apiEventDeletePath = "/api/events/delete";
export const apiEventLibraryAddPath = "/api/event-library/add";
export const apiEventLibraryRemovePath = "/api/event-library/remove";
export const apiEventUserAddPath = "/api/event-user/add";
export const apiEventUserJoinPath = "/api/event-user/join";
export const apiEventUserRemovePath = "/api/event-user/remove";
export const apiEventUserKickPath = "/api/event-user/kick";
export const apiEventUserUpdateRolePath = "/api/event-user/update-role";

// Community API paths
export const apiCommunitySavePath = "/api/communities/save";
export const apiCommunityDeletePath = "/api/communities/delete";
export const apiCommunityLibraryPath = "/api/communities/library";
export const apiCommunityUserAddPath = "/api/community-user/add";
export const apiCommunityUserJoinPath = "/api/community-user/join";
export const apiCommunityUserRemovePath = "/api/community-user/remove";
export const apiCommunityUserKickPath = "/api/community-user/kick";
export const apiCommunityUserUpdateRolePath = "/api/community-user/update-role";
export const apiCommunityEventAddPath = "/api/community-event/add";
export const apiCommunityEventRemovePath = "/api/community-event/remove";
export const apiCommunitySongAddPath = "/api/community-song/add";
export const apiCommunitySongRemovePath = "/api/community-song/remove";
export const apiCommunityPlaylistAddPath = "/api/community-playlist/add";
export const apiCommunityPlaylistRemovePath = "/api/community-playlist/remove";
export const apiCommunityShareRequestCreatePath = "/api/community-share-request/create";
export const apiCommunityShareRequestUpdateStatusPath =
	"/api/community-share-request/update-status";
export const apiCommunitySetActiveEventPath = "/api/community/set-active-event";
export const apiUploadPath = "/api/upload";
export const apiHelloPath = "/api/hello";
export const healthPath = "/health";
export const apiLLMSubscriptionPath = "/api/llm/subscription";

// Sharing API paths
export const apiShareCreatePath = "/api/shares/create";
export const apiShareUpdateStatusPath = "/api/shares/update-status";
export const apiShareRejectByItemPath = "/api/shares/reject-by-item";
export const apiShareListPath = "/api/shares/list";

/** Frontend route for account deletion confirmation (nested under dashboard) */
export const deleteAccountPath = "delete-account";

// Image paths
export const imageLibraryPath = "image-library";
export const imageUploadPath = "image-upload";
export const imageEditPath = "image-edit";

/** Base path for viewing an image by slug; use as "image/:image_slug" in routes */
export const imageViewPath = "image";

// Image API paths
export const apiImageUploadPath = "/api/images/upload";
export const apiImageDeletePath = "/api/images/delete";
export const apiImageUpdatePath = "/api/images/update";
export const apiImageServeBasePath = "/api/images/serve";
export const apiImageLibraryAddPath = "/api/image-library/add";
export const apiImageLibraryRemovePath = "/api/image-library/remove";

// Tag paths
/** Tag library list page (accessible from header menu); full path: /dashboard/tag-library */
export const tagLibraryPath = "tag-library";

/** Base path for viewing a tag; use as "tag/:tag_slug" in routes; full path: /dashboard/tag/:tag_slug */
export const tagViewPath = "tag";

// Tag API paths
export const apiTagAddToItemPath = "/api/tags/add-to-item";
export const apiTagRemoveFromItemPath = "/api/tags/remove-from-item";
export const apiTagSearchPath = "/api/tags/search";
export const apiTagLibraryAddPath = "/api/tag-library/add";
export const apiTagLibraryRemovePath = "/api/tag-library/remove";
