import { Hono } from "hono";

import oauthCallbackHandler from "@/api/oauth/oauthCallbackHandler";
import {
	apiAccountDeletePath,
	apiAccountRegisterPath,
	apiAuthSignOutPath,
	apiAuthVisitorPath,
	apiEventDeletePath,
	apiEventSavePath,
	apiEventUserAddPath,
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
	apiUserLibraryRemovePath,
	apiUserTokenPath,
	healthPath,
} from "@/shared/paths";

import accountDelete from "./account/accountDelete";
import accountRegister from "./account/accountRegister";
import signOutHandler from "./auth/signOut";
import updateSongPublicHandler from "./dev/updateSongPublicHandler";
import { type Bindings } from "./env";
import eventUserAdd from "./event-user/eventUserAdd";
import eventUserRemove from "./event-user/eventUserRemove";
import eventUserUpdateRoleHandler from "./event-user/eventUserUpdateRole";
import eventDelete from "./event/eventDelete";
import eventSave from "./event/eventSave";
import { handleHttpEndpoint } from "./http/http-utils";
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
app.get(
	apiUserTokenPath,
	handleHttpEndpoint((ctx) => getUserToken(ctx)),
);

// Song save endpoint
app.post(
	apiSongsSavePath,
	handleHttpEndpoint((ctx) => songSave(ctx)),
);

// Song delete endpoint (owner only)
app.post(
	apiSongsDeletePath,
	handleHttpEndpoint((ctx) => songDelete(ctx)),
);

// Add song to library endpoint
app.post(
	apiSongLibraryAddPath,
	handleHttpEndpoint((ctx) => addSongToLibraryHandler(ctx)),
);

// Playlist save endpoint
app.post(
	apiPlaylistSavePath,
	handleHttpEndpoint((ctx) => playlistSave(ctx)),
);

// Playlist delete endpoint (owner only)
app.post(
	apiPlaylistDeletePath,
	handleHttpEndpoint((ctx) => playlistDelete(ctx)),
);

// Add playlist to library endpoint
app.post(
	apiPlaylistLibraryAddPath,
	handleHttpEndpoint((ctx) => addPlaylistToLibraryHandler(ctx)),
);

// Remove playlist from library endpoint
app.post(
	apiPlaylistLibraryRemovePath,
	handleHttpEndpoint((ctx) => removePlaylistFromLibraryHandler(ctx)),
);

// User library (follow users)
app.post(
	apiUserLibraryAddPath,
	handleHttpEndpoint((ctx) => addUserToLibraryHandler(ctx)),
);

app.post(
	apiUserLibraryRemovePath,
	handleHttpEndpoint((ctx) => removeUserFromLibraryHandler(ctx)),
);

// Event save endpoint
app.post(
	apiEventSavePath,
	handleHttpEndpoint((ctx) => eventSave(ctx)),
);

// Event delete endpoint (owner only)
app.post(
	apiEventDeletePath,
	handleHttpEndpoint((ctx) => eventDelete(ctx)),
);

// Event user management endpoints
app.post(
	apiEventUserAddPath,
	handleHttpEndpoint((ctx) => eventUserAdd(ctx)),
);

app.post(
	apiEventUserRemovePath,
	handleHttpEndpoint((ctx) => eventUserRemove(ctx)),
);

app.post(
	apiEventUserUpdateRolePath,
	handleHttpEndpoint((ctx) => eventUserUpdateRoleHandler(ctx)),
);

// File upload endpoint
app.post(apiUploadPath, (ctx) => ctx.json({ message: "Upload endpoint - to be implemented" }));

// Dev-only helper to update song_public rows and trigger realtime events.
// This endpoint is intentionally gated to non-production environments.
// Dev-only helper to update song_public rows and trigger realtime events.
// Extracted to `api/src/dev/updateSongPublicHandler.ts`
app.post("/api/dev/song-public/update", updateSongPublicHandler);
// Current user/session endpoint
app.get(
	apiMePath,
	handleHttpEndpoint((ctx) => me(ctx)),
);

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
