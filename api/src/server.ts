import { Hono } from "hono";

import oauthCallbackHandler from "@/api/oauth/oauthCallbackHandler";
import {
	apiAccountDeletePath,
	apiAccountRegisterPath,
	apiAuthSignOutPath,
	apiAuthVisitorPath,
	apiCommunityDeletePath,
	apiCommunityEventAddPath,
	apiCommunityEventRemovePath,
	apiCommunityLibraryPath,
	apiCommunitySavePath,
	apiCommunityUserAddPath,
	apiCommunityUserJoinPath,
	apiCommunityUserKickPath,
	apiCommunityUserRemovePath,
	apiCommunityUserUpdateRolePath,
	apiEventDeletePath,
	apiEventLibraryAddPath,
	apiEventLibraryRemovePath,
	apiEventSavePath,
	apiEventUserAddPath,
	apiEventUserJoinPath,
	apiEventUserKickPath,
	apiEventUserRemovePath,
	apiEventUserUpdateRolePath,
	apiHelloPath,
	apiMePath,
	apiOauthCallbackPath,
	apiOauthSignInPath,
	apiPlaylistDeletePath,
	apiPlaylistLibraryAddPath,
	apiPlaylistLibraryRemovePath,
	apiPlaylistSavePath,
	apiSongLibraryAddPath,
	apiSongsDeletePath,
	apiSongsSavePath,
	apiUploadPath,
	apiUserLibraryAddPath,
	apiUserLibraryLookupPath,
	apiUserLibraryRemovePath,
	apiUserTokenPath,
	healthPath,
} from "@/shared/paths";

import accountDelete from "./account/accountDelete";
import accountRegister from "./account/accountRegister";
import signOutHandler from "./auth/signOut";
import communityEventAdd from "./community-event/communityEventAdd";
import communityEventRemove from "./community-event/communityEventRemove";
import communityUserAdd from "./community-user/communityUserAdd";
import communityUserJoin from "./community-user/communityUserJoin";
import communityUserKick from "./community-user/communityUserKick";
import communityUserRemove from "./community-user/communityUserRemove";
import communityUserUpdateRole from "./community-user/communityUserUpdateRole";
import communityDelete from "./community/communityDelete";
import communityLibrary from "./community/communityLibrary";
import communitySave from "./community/communitySave";
import updateSongPublicHandler from "./dev/updateSongPublicHandler";
import { type Bindings } from "./env";
import addEventToLibraryHandler from "./event-library/addEventToLibrary";
import removeEventFromLibraryHandler from "./event-library/removeEventFromLibrary";
import eventUserAdd from "./event-user/eventUserAdd";
import eventUserJoin from "./event-user/eventUserJoin";
import eventUserKick from "./event-user/eventUserKick";
import eventUserRemove from "./event-user/eventUserRemove";
import eventUserUpdateRoleHandler from "./event-user/eventUserUpdateRole";
import eventDelete from "./event/eventDelete";
import eventSave from "./event/eventSave";
import handleHttpEndpoint from "./http/handleHttpEndpoint";
import me from "./me";
import corsMiddleware from "./middleware/cors";
import handleAppError from "./middleware/handleAppError";
import supabaseHealthMiddleware from "./middleware/supabaseHealth";
import oauthSignInDefault from "./oauth/oauthSignIn";
import addPlaylistToLibraryHandler from "./playlist-library/addPlaylistToLibrary";
import removePlaylistFromLibraryHandler from "./playlist-library/removePlaylistFromLibrary";
import playlistDelete from "./playlist/playlistDelete";
import playlistSave from "./playlist/playlistSave";
import addSongToLibraryHandler from "./song-library/addSongToLibrary";
import songDelete from "./song/songDelete";
import songSave from "./song/songSave";
import getSupabaseClientTokenHandler from "./supabase/getSupabaseClientTokenHandler";
import addUserToLibraryHandler from "./user-library/addUserToLibrary";
import lookupUserByUsernameHandler from "./user-library/lookupUserByUsername";
import removeUserFromLibraryHandler from "./user-library/removeUserFromLibrary";
import getUserToken from "./user-session/getUserToken";

const app: Hono<{ Bindings: Bindings }> = new Hono<{ Bindings: Bindings }>();

// Dynamic CORS middleware (Cloudflare Workers friendly)
// Extracted to `api/src/middleware/cors.ts`
app.use("*", corsMiddleware);

// One-time startup health check for Supabase host.
// Extracted to `api/src/middleware/supabaseHealth.ts`
app.use("*", supabaseHealthMiddleware);

// Health check endpoint
app.get(healthPath, (ctx) =>
	ctx.json({
		status: "ok",
		environment: ctx.env.ENVIRONMENT,
		timestamp: new Date().toISOString(),
	}),
);

// Lightweight hello endpoint used by some E2E tests
app.get(apiHelloPath, (ctx) => ctx.json({ message: "Hello from custom API endpoint!" }));

// Supabase client token endpoint - provides a JWT for client-side Supabase operations
app.get(apiAuthVisitorPath, getSupabaseClientTokenHandler);

// Supabase user token endpoint - provides a JWT for authenticated user
app.get(apiUserTokenPath, handleHttpEndpoint(getUserToken));

// Song save endpoint
app.post(apiSongsSavePath, handleHttpEndpoint(songSave));

// Song delete endpoint (owner only)
app.post(apiSongsDeletePath, handleHttpEndpoint(songDelete));

// Add song to library endpoint
app.post(apiSongLibraryAddPath, handleHttpEndpoint(addSongToLibraryHandler));

// Playlist save endpoint
app.post(apiPlaylistSavePath, handleHttpEndpoint(playlistSave));

// Playlist delete endpoint (owner only)
app.post(apiPlaylistDeletePath, handleHttpEndpoint(playlistDelete));

// Add playlist to library endpoint
app.post(apiPlaylistLibraryAddPath, handleHttpEndpoint(addPlaylistToLibraryHandler));

// Remove playlist from library endpoint
app.post(apiPlaylistLibraryRemovePath, handleHttpEndpoint(removePlaylistFromLibraryHandler));

// User library (follow users)
app.post(apiUserLibraryAddPath, handleHttpEndpoint(addUserToLibraryHandler));

app.post(apiUserLibraryRemovePath, handleHttpEndpoint(removeUserFromLibraryHandler));

app.post(apiUserLibraryLookupPath, handleHttpEndpoint(lookupUserByUsernameHandler));

// Event save endpoint
app.post(apiEventSavePath, handleHttpEndpoint(eventSave));

// Event delete endpoint (owner only)
app.post(apiEventDeletePath, handleHttpEndpoint(eventDelete));

// Event user management endpoints
app.post(apiEventUserAddPath, handleHttpEndpoint(eventUserAdd));

app.post(apiEventUserJoinPath, handleHttpEndpoint(eventUserJoin));

app.post(apiEventUserRemovePath, handleHttpEndpoint(eventUserRemove));

app.post(apiEventUserKickPath, handleHttpEndpoint(eventUserKick));

app.post(apiEventUserUpdateRolePath, handleHttpEndpoint(eventUserUpdateRoleHandler));

// Event library endpoints (add/remove events from user's personal library)
app.post(apiEventLibraryAddPath, handleHttpEndpoint(addEventToLibraryHandler));

app.post(apiEventLibraryRemovePath, handleHttpEndpoint(removeEventFromLibraryHandler));

// Community endpoints
app.post(apiCommunitySavePath, handleHttpEndpoint(communitySave));

app.post(apiCommunityDeletePath, handleHttpEndpoint(communityDelete));

app.get(apiCommunityLibraryPath, handleHttpEndpoint(communityLibrary));

// Community user management
app.post(apiCommunityUserAddPath, handleHttpEndpoint(communityUserAdd));

app.post(apiCommunityUserJoinPath, handleHttpEndpoint(communityUserJoin));

app.post(apiCommunityUserRemovePath, handleHttpEndpoint(communityUserRemove));

app.post(apiCommunityUserKickPath, handleHttpEndpoint(communityUserKick));

app.post(apiCommunityUserUpdateRolePath, handleHttpEndpoint(communityUserUpdateRole));

// Community event management
app.post(apiCommunityEventAddPath, handleHttpEndpoint(communityEventAdd));

app.post(apiCommunityEventRemovePath, handleHttpEndpoint(communityEventRemove));

// File upload endpoint
app.post(apiUploadPath, (ctx) => ctx.json({ message: "Upload endpoint - to be implemented" }));

// Dev-only helper to update song_public rows and trigger realtime events.
// This endpoint is intentionally gated to non-production environments.
// Dev-only helper to update song_public rows and trigger realtime events.
// Extracted to `api/src/dev/updateSongPublicHandler.ts`
app.post("/api/dev/song-public/update", updateSongPublicHandler);
// Current user/session endpoint
app.get(apiMePath, handleHttpEndpoint(me));

// Sign-out endpoint
app.post(apiAuthSignOutPath, signOutHandler);

// OAuth sign-in (provider path param) and callback
app.get(`${apiOauthSignInPath}/:provider`, oauthSignInDefault);
app.get(apiOauthCallbackPath, oauthCallbackHandler);

// Account registration
app.post(apiAccountRegisterPath, handleHttpEndpoint(accountRegister));
// Account deletion
app.post(apiAccountDeletePath, handleHttpEndpoint(accountDelete));

// Global error handler extracted to `api/src/middleware/handleAppError.ts`
app.onError(handleAppError);

export default app;
