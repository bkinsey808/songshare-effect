import { Hono } from "hono";

import getErrorMessage from "@/api/getErrorMessage";
import oauthCallbackHandler from "@/api/oauth/oauthCallbackHandler";
import {
	ACCESS_CONTROL_MAX_AGE_SEC,
	HTTP_INTERNAL,
	HTTP_NO_CONTENT,
	ONE_HOUR_SECONDS,
} from "@/shared/constants/http";
import {
	apiAccountDeletePath,
	apiAccountRegisterPath,
	apiAuthSignOutPath,
	apiAuthVisitorPath,
	apiHelloPath,
	apiMePath,
	apiOauthCallbackPath,
	apiOauthSignInPath,
	apiSongLibraryAddPath,
	apiSongsSavePath,
	apiUploadPath,
	apiUserTokenPath,
	healthPath,
} from "@/shared/paths";

import accountDelete from "./account/accountDelete";
import accountRegister from "./account/accountRegister";
import buildClearCookieHeader from "./cookie/buildClearCookieHeader";
import { userSessionCookieName } from "./cookie/cookie";
import getAllowedOrigins from "./cors/getAllowedOrigins";
import getOriginToCheck from "./cors/getOriginToCheck";
import verifySameOriginOrThrow from "./csrf/verifySameOriginOrThrow";
import { type Bindings } from "./env";
import { handleHttpEndpoint } from "./http/http-utils";
import me from "./me";
import oauthSignInDefault from "./oauth/oauthSignIn";
import addSongToLibraryHandler from "./song-library/addSongToLibrary";
import { songSave } from "./song/songSave";
import getSupabaseClientToken from "./supabase/getSupabaseClientToken";
import getUserToken from "./user-session/getUserToken";

const app: Hono<{ Bindings: Bindings }> = new Hono<{ Bindings: Bindings }>();

// Dynamic CORS middleware (Cloudflare Workers friendly)
// Reads comma-separated ALLOWED_ORIGINS from bindings (ctx.env.ALLOWED_ORIGINS)
// Falls back to local dev origins when not provided.
app.use("*", async (ctx, next) => {
	const originHeader = ctx.req.header("Origin");

	const allowedOrigins = getAllowedOrigins(ctx.env);
	const originToCheck = getOriginToCheck(ctx);

	const allowedMethods = "GET, POST, PUT, DELETE, OPTIONS";
	const allowedHeaders = "Content-Type, Authorization, X-CSRF-Token";

	const isProd = ctx.env.ENVIRONMENT === "production";
	const originAllowed =
		Boolean(originToCheck) &&
		(isProd ? allowedOrigins.includes(originToCheck) : Boolean(originHeader));

	if (originAllowed && originToCheck) {
		// Only allow the specific origin (do NOT echo '*' when credentials are used)
		ctx.header("Access-Control-Allow-Origin", originToCheck);
		ctx.header("Access-Control-Allow-Methods", allowedMethods);
		ctx.header("Access-Control-Allow-Headers", allowedHeaders);
		// Allow cookies to be sent from the allowed origin
		ctx.header("Access-Control-Allow-Credentials", "true");
		// Inform caches that responses vary by Origin
		ctx.header("Vary", "Origin");
	}

	// Preflight
	if (ctx.req.method === "OPTIONS") {
		if (originAllowed && typeof originHeader === "string") {
			// Return a preflight response that includes the CORS headers we set
			// above. We build an explicit headers object to avoid relying on
			// framework internals when returning early.
			const headers = new Headers();
			headers.set("Access-Control-Allow-Origin", originHeader);
			headers.set("Access-Control-Allow-Methods", allowedMethods);
			headers.set("Access-Control-Allow-Headers", allowedHeaders);
			headers.set("Access-Control-Allow-Credentials", "true");
			headers.set("Vary", "Origin");
			// Cache preflight responses for a short time to reduce repeated preflight requests
			headers.set("Access-Control-Max-Age", String(ACCESS_CONTROL_MAX_AGE_SEC));
			return new Response(undefined, { status: HTTP_NO_CONTENT, headers });
		}

		// Origin wasn't allowed — respond without CORS headers so browsers
		// will treat the preflight as failed. Also log for diagnostics.
		console.warn("CORS preflight rejected for origin:", originHeader);
		return new Response(undefined, { status: HTTP_NO_CONTENT });
	}
	await next();

	return undefined;
});

// One-time startup health check for Supabase host. Runs on the first
// incoming request (dev-friendly) and logs a clear warning if the
// configured `VITE_SUPABASE_URL` cannot be contacted.
const STARTUP_SUPABASE_TIMEOUT_MS = 3000;
const SUPABASE_ACCEPTABLE_404 = 404;
declare global {
	// Declare the specific global variable we use for a one-time health check.
	var __songshare_supabase_health_checked: boolean | undefined;
}

function isSupabaseHealthChecked(): boolean {
	return Boolean(globalThis.__songshare_supabase_health_checked === true);
}

function markSupabaseHealthChecked(): void {
	globalThis.__songshare_supabase_health_checked = true;
}

async function runSupabaseHealthCheck(url: string): Promise<void> {
	try {
		const parsed = new URL(url);
		const controller = new AbortController();
		const timeout = setTimeout(() => {
			controller.abort();
		}, STARTUP_SUPABASE_TIMEOUT_MS);
		try {
			const res = await fetch(parsed.origin, {
				method: "HEAD",
				signal: controller.signal,
			});
			if (!res.ok && res.status !== SUPABASE_ACCEPTABLE_404) {
				console.warn("[startup-check] Supabase host responded with status:", res.status);
			}
		} catch (error) {
			console.warn(
				"[startup-check] Failed to contact Supabase host; check VITE_SUPABASE_URL and network/DNS:",
				getErrorMessage(error),
			);
		} finally {
			clearTimeout(timeout);
		}
	} catch (error) {
		console.warn("[startup-check] Supabase URL parse failed:", getErrorMessage(error));
	}
}

app.use("*", async (ctx, next) => {
	if (isSupabaseHealthChecked()) {
		await next();
		return undefined;
	}

	markSupabaseHealthChecked();
	const url = ctx.env.VITE_SUPABASE_URL ?? "";
	if (!url) {
		console.warn("[startup-check] VITE_SUPABASE_URL is not configured");
		await next();
		return undefined;
	}

	await runSupabaseHealthCheck(url);

	await next();
	return undefined;
});

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
app.get(apiAuthVisitorPath, async (ctx) => {
	try {
		const {
			VITE_SUPABASE_URL,
			SUPABASE_SERVICE_KEY,
			SUPABASE_VISITOR_EMAIL,
			SUPABASE_VISITOR_PASSWORD,
		} = ctx.env;
		const env = {
			VITE_SUPABASE_URL,
			SUPABASE_SERVICE_KEY,
			SUPABASE_VISITOR_EMAIL,
			SUPABASE_VISITOR_PASSWORD,
		};

		const supabaseClientToken = await getSupabaseClientToken(env);

		return ctx.json({
			access_token: supabaseClientToken,
			token_type: "bearer",
			// 1 hour
			expires_in: ONE_HOUR_SECONDS,
		});
	} catch (error) {
		console.error("Failed to generate Supabase client token:", getErrorMessage(error));
		return Response.json(
			{ error: "Failed to generate Supabase client token" },
			{
				status: HTTP_INTERNAL,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
});

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

// Add song to library endpoint
app.post(
	apiSongLibraryAddPath,
	handleHttpEndpoint((ctx) => addSongToLibraryHandler(ctx)),
);

// File upload endpoint
app.post(apiUploadPath, (ctx) => ctx.json({ message: "Upload endpoint - to be implemented" }));

// Current user/session endpoint
app.get(
	apiMePath,
	handleHttpEndpoint((ctx) => me(ctx)),
);

// Sign-out endpoint: clears the user session cookie and returns success.
app.post(apiAuthSignOutPath, (ctx) => {
	try {
		// CSRF check: ensure sign-out requests originate from an allowed origin
		verifySameOriginOrThrow(ctx);
		// Clear the userSession cookie by setting an expired cookie on the response
		// Use the cookie helper so attributes (SameSite/Secure/Domain) match how
		// the cookie was originally set in the OAuth callback.
		const cookieValue = buildClearCookieHeader(ctx, userSessionCookieName);
		ctx.res.headers.append("Set-Cookie", cookieValue);
		return ctx.json({ success: true });
	} catch (error) {
		console.error("Failed to sign out", getErrorMessage(error));
		return Response.json(
			{ error: "failed" },
			{
				status: HTTP_INTERNAL,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
});

// OAuth sign-in (provider path param) and callback
app.get(`${apiOauthSignInPath}/:provider`, oauthSignInDefault);
app.get(apiOauthCallbackPath, oauthCallbackHandler);

// Account registration
app.post(apiAccountRegisterPath, handleHttpEndpoint(accountRegister));
// Account deletion
app.post(apiAccountDeletePath, handleHttpEndpoint(accountDelete));

// Global error handler: catch any uncaught exceptions in route handlers
// and log them to Cloudflare Logs so we can diagnose production failures
// The onError handler intentionally uses a callback-style handler. Disable
// specific rules that would force converting this to a different async
// pattern; the handler must synchronously return a Response (or a Promise)
// and we prefer an explicit implementation here.
function handleAppError(err: unknown, _ctx: unknown): Response {
	try {
		if (err instanceof Error) {
			console.error("[app.onError] Unhandled exception:", err.stack ?? err.message);
		} else {
			console.error("[app.onError] Unhandled exception (non-Error):", getErrorMessage(err));
		}
	} catch (error) {
		console.error("[app.onError] Failed to log error:", getErrorMessage(error));
	}

	// Return a generic 500 response without leaking internals to clients
	return Response.json(
		{ success: false, error: "Internal server error" },
		{
			status: HTTP_INTERNAL,
			headers: { "Content-Type": "application/json" },
		},
	);
}

app.onError(handleAppError);

export default app;
