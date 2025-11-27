import { Hono } from "hono";

import { getErrorMessage } from "@/api/getErrorMessage";
import oauthCallbackHandler from "@/api/oauth/oauthCallbackHandler";
import {
	ACCESS_CONTROL_MAX_AGE_SEC,
	HTTP_NO_CONTENT,
	HTTP_INTERNAL,
	HTTP_BAD_REQUEST,
	HTTP_UNAUTHORIZED,
	ONE_HOUR_SECONDS,
} from "@/shared/constants/http";
import {
	apiMePath,
	apiOauthCallbackPath,
	apiOauthSignInPath,
} from "@/shared/paths";

import type { Bindings } from "./env";

import accountDelete from "./account/accountDelete";
import accountRegister from "./account/accountRegister";
import { buildClearCookieHeader } from "./cookie/buildClearCookieHeader";
import { userSessionCookieName } from "./cookie/cookie";
import { getAllowedOrigins } from "./cors/getAllowedOrigins";
import { getOriginToCheck } from "./cors/getOriginToCheck";
import { verifySameOriginOrThrow } from "./csrf/verifySameOriginOrThrow";
import { handleHttpEndpoint } from "./http/http-utils";
import { me } from "./me";
import oauthSignInHandler from "./oauth/oauthSignIn";
import { songSave } from "./song/songSave";
import { getSupabaseClientToken } from "./supabase/getSupabaseClientToken";
import { getSupabaseUserToken } from "./supabase/getSupabaseUserToken";

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

// Health check endpoint
app.get("/health", (ctx) =>
	ctx.json({
		status: "ok",
		environment: ctx.env.ENVIRONMENT,
		timestamp: new Date().toISOString(),
	}),
);

// Lightweight hello endpoint used by some E2E tests
app.get("/api/hello", (ctx) =>
	ctx.json({ message: "Hello from custom API endpoint!" }),
);

// Supabase client token endpoint - provides a JWT for client-side Supabase operations
app.get("/api/auth/visitor", async (ctx) => {
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
		console.error(
			"Failed to generate Supabase client token:",
			getErrorMessage(error),
		);
		return new Response(
			JSON.stringify({ error: "Failed to generate Supabase client token" }),
			{
				status: HTTP_INTERNAL,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
});

// User authentication endpoint - provides a JWT for authenticated user operations
app.post("/api/auth/user", async (ctx) => {
	try {
		const rawBody = (await ctx.req.json()) as unknown;

		if (typeof rawBody !== "object" || rawBody === null) {
			return new Response(
				JSON.stringify({ error: "Email and password are required" }),
				{
					status: HTTP_BAD_REQUEST,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const body = rawBody as { email?: unknown; password?: unknown };

		if (typeof body.email !== "string" || typeof body.password !== "string") {
			return new Response(
				JSON.stringify({ error: "Email and password are required" }),
				{
					status: HTTP_BAD_REQUEST,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

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

		const userToken = await getSupabaseUserToken({
			env,
			email: body.email,
			password: body.password,
		});

		return ctx.json({
			access_token: userToken,
			token_type: "bearer",
			// 1 hour
			expires_in: ONE_HOUR_SECONDS,
		});
	} catch (error) {
		console.error("Failed to authenticate user:", getErrorMessage(error));
		return new Response(JSON.stringify({ error: "Authentication failed" }), {
			status: HTTP_UNAUTHORIZED,
			headers: { "Content-Type": "application/json" },
		});
	}
});

// Song save endpoint
app.post(
	"/api/songs/save",
	handleHttpEndpoint((ctx) => songSave(ctx)),
);

// File upload endpoint
app.post("/api/upload", (ctx) =>
	ctx.json({ message: "Upload endpoint - to be implemented" }),
);

// Current user/session endpoint
app.get(
	apiMePath,
	handleHttpEndpoint((ctx) => me(ctx)),
);

// Sign-out endpoint: clears the user session cookie and returns success.
app.post("/api/auth/signout", (ctx) => {
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
		console.error("Failed to sign out", getErrorMessage(err));
		return new Response(JSON.stringify({ error: "failed" }), {
			status: HTTP_INTERNAL,
			headers: { "Content-Type": "application/json" },
		});
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
app.onError((err, _ctx) => {
	try {
		if (err instanceof Error) {
			console.error(
				"[app.onError] Unhandled exception:",
				err.stack ?? err.message,
			);
		} else {
			console.error(
				"[app.onError] Unhandled exception (non-Error):",
				getErrorMessage(err),
			);
		}
	} catch (logErr) {
		console.error(
			"[app.onError] Failed to log error:",
			getErrorMessage(logErr),
		);
	}

	// Return a generic 500 response without leaking internals to clients
	return new Response(
		JSON.stringify({ success: false, error: "Internal server error" }),
		{
			status: HTTP_INTERNAL,
			headers: { "Content-Type": "application/json" },
		},
	);
});

export default app;
