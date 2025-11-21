import { Hono } from "hono";

import accountDelete from "./account/accountDelete";
import accountRegister from "./account/accountRegister";
import { buildClearCookieHeader } from "./cookie/buildClearCookieHeader";
import { userSessionCookieName } from "./cookie/cookie";
import { getAllowedOrigins } from "./cors/getAllowedOrigins";
import { getOriginToCheck } from "./cors/getOriginToCheck";
import { verifySameOriginOrThrow } from "./csrf/verifySameOriginOrThrow";
import type { Bindings } from "./env";
import { handleHttpEndpoint } from "./http/http-utils";
import { me } from "./me";
import oauthSignInHandler from "./oauth/oauthSignIn";
import { songSave } from "./song/songSave";
import { getSupabaseClientToken } from "./supabase/getSupabaseClientToken";
import { getSupabaseUserToken } from "./supabase/getSupabaseUserToken";
import oauthCallbackHandler from "@/api/oauth/oauthCallbackHandler";
import {
	apiMePath,
	apiOauthCallbackPath,
	apiOauthSignInPath,
} from "@/shared/paths";

const app: Hono<{ Bindings: Bindings }> = new Hono<{ Bindings: Bindings }>();

// Dynamic CORS middleware (Cloudflare Workers friendly)
// Reads comma-separated ALLOWED_ORIGINS from bindings (ctx.env.ALLOWED_ORIGINS)
// Falls back to local dev origins when not provided.
app.use("*", async (ctx, next) => {
	const originHeader = ctx.req.header("Origin");

	const allowedOrigins = getAllowedOrigins(
		ctx.env as unknown as Record<string, string | undefined>,
	);
	const originToCheck = getOriginToCheck(ctx);

	const allowedMethods = "GET, POST, PUT, DELETE, OPTIONS";
	const allowedHeaders = "Content-Type, Authorization, X-CSRF-Token";

	const isProd =
		(ctx.env as unknown as { ENVIRONMENT?: string }).ENVIRONMENT ===
		"production";
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
			headers.set("Access-Control-Max-Age", "600");
			return new Response(undefined, { status: 204, headers });
		}

		// Origin wasn't allowed — respond without CORS headers so browsers
		// will treat the preflight as failed. Also log for diagnostics.
		console.warn("CORS preflight rejected for origin:", originHeader);
		return new Response(undefined, { status: 204 });
	}

	await next();

	return undefined;
});

// Health check endpoint
app.get("/health", (ctx) => {
	return ctx.json({
		status: "ok",
		environment: ctx.env.ENVIRONMENT,
		timestamp: new Date().toISOString(),
	});
});

// Lightweight hello endpoint used by some E2E tests
app.get("/api/hello", (ctx) => {
	return ctx.json({ message: "Hello from custom API endpoint!" });
});

// Supabase client token endpoint - provides a JWT for client-side Supabase operations
app.get("/api/auth/visitor", async (ctx) => {
	try {
		const env = ctx.env as unknown as {
			VITE_SUPABASE_URL: string;
			SUPABASE_SERVICE_KEY: string;
			SUPABASE_VISITOR_EMAIL: string;
			SUPABASE_VISITOR_PASSWORD: string;
		};

		const supabaseClientToken = await getSupabaseClientToken(env);

		return ctx.json({
			access_token: supabaseClientToken,
			token_type: "bearer",
			// 1 hour
			expires_in: 3600,
		});
	} catch (error) {
		console.error("Failed to generate Supabase client token:", error);
		return ctx.json({ error: "Failed to generate Supabase client token" }, 500);
	}
});

// User authentication endpoint - provides a JWT for authenticated user operations
app.post("/api/auth/user", async (ctx) => {
	try {
		const body = (await ctx.req.json()) as { email: string; password: string };

		if (!body.email || !body.password) {
			return ctx.json({ error: "Email and password are required" }, 400);
		}

		const env = ctx.env as unknown as {
			VITE_SUPABASE_URL: string;
			SUPABASE_SERVICE_KEY: string;
			SUPABASE_VISITOR_EMAIL: string;
			SUPABASE_VISITOR_PASSWORD: string;
		};

		const userToken = await getSupabaseUserToken({
			env,
			email: body.email,
			password: body.password,
		});

		return ctx.json({
			access_token: userToken,
			token_type: "bearer",
			// 1 hour
			expires_in: 3600,
		});
	} catch (error) {
		console.error("Failed to authenticate user:", error);
		return ctx.json({ error: "Authentication failed" }, 401);
	}
});

// Song save endpoint
app.post(
	"/api/songs/save",
	handleHttpEndpoint((ctx) => songSave(ctx)),
);

// File upload endpoint
app.post("/api/upload", async (ctx) => {
	// TO-DO: Implement file upload to R2 using Effect
	return ctx.json({ message: "Upload endpoint - to be implemented" });
});

// Current user/session endpoint
app.get(
	apiMePath,
	handleHttpEndpoint((ctx) => me(ctx)),
);

// Sign-out endpoint: clears the user session cookie and returns success.
app.post("/api/auth/signout", async (ctx) => {
	try {
		// CSRF check: ensure sign-out requests originate from an allowed origin
		verifySameOriginOrThrow(ctx);
		// Clear the userSession cookie by setting an expired cookie on the response
		// Use the cookie helper so attributes (SameSite/Secure/Domain) match how
		// the cookie was originally set in the OAuth callback.
		const cookieValue = buildClearCookieHeader(ctx, userSessionCookieName);
		ctx.res.headers.append("Set-Cookie", cookieValue);
		return ctx.json({ success: true });
	} catch (err) {
		console.error("Failed to sign out", err);
		return ctx.json({ error: "failed" }, 500);
	}
});

// OAuth sign-in (provider path param) and callback
app.get(`${apiOauthSignInPath}/:provider`, oauthSignInHandler);
app.get(apiOauthCallbackPath, oauthCallbackHandler);

// Account registration
app.post("/api/account/register", handleHttpEndpoint(accountRegister));
// Account deletion
app.post("/api/account/delete", handleHttpEndpoint(accountDelete));

// Global error handler: catch any uncaught exceptions in route handlers
// and log them to Cloudflare Logs so we can diagnose production failures
app.onError((err, ctx) => {
	try {
		if (err instanceof Error) {
			console.error(
				"[app.onError] Unhandled exception:",
				err.stack ?? err.message,
			);
		} else {
			console.error(
				"[app.onError] Unhandled exception (non-Error):",
				String(err),
			);
		}
	} catch (logErr) {
		console.error("[app.onError] Failed to log error:", String(logErr));
	}

	// Return a generic 500 response without leaking internals to clients
	return ctx.json({ success: false, error: "Internal server error" }, 500);
});

export default app;
