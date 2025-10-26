import { Effect, Schema } from "effect";
import { type Context, Hono } from "hono";

import accountRegister from "./accountRegister";
// Dynamic CORS implemented below; no need to import the static helper

import type { Bindings } from "./env";
import { type AppError, ValidationError } from "./errors";
import { handleHttpEndpoint } from "./http-utils";
import { me } from "./me";
import oauthSignInHandler from "./oauth/oauthSignIn";
import { CreateSongRequestSchema, type Song } from "./schemas";
import { SongService, createInMemorySongService } from "./services";
import {
	getSupabaseClientToken,
	getSupabaseUserToken,
} from "./supabaseClientToken";
import oauthCallbackHandler from "@/api/oauth/oauthCallbackHandler";
import {
	apiMePath,
	apiOauthCallbackPath,
	apiOauthSignInPath,
} from "@/shared/paths";
import { MUSIC_GENRES } from "@/shared/utils/constants";

// For individual file check - R2Bucket type is available in project context
// type R2Bucket = unknown;

const app: Hono<{ Bindings: Bindings }> = new Hono<{ Bindings: Bindings }>();

// Dynamic CORS middleware (Cloudflare Workers friendly)
// Reads comma-separated ALLOWED_ORIGINS from bindings (ctx.env.ALLOWED_ORIGINS)
// Falls back to local dev origins when not provided.
app.use("*", async (ctx, next) => {
	const originHeader = ctx.req.header("Origin");

	// Bindings may provide a comma-separated list of allowed origins. Example:
	// ALLOWED_ORIGINS="https://app.example.com,https://admin.example.com"
	const allowedOriginsEnv = (ctx.env as unknown as { ALLOWED_ORIGINS?: string })
		.ALLOWED_ORIGINS;

	const defaultDevOrigins = [
		"http://localhost:5173",
		"http://localhost:5174",
		"http://localhost:3000",
		"https://your-pages-domain.pages.dev",
	];

	const allowedOrigins =
		typeof allowedOriginsEnv === "string" && allowedOriginsEnv.length > 0
			? allowedOriginsEnv
					.split(",")
					.map((rawOrigin) => rawOrigin.trim())
					.filter(Boolean)
			: defaultDevOrigins;

	if (typeof originHeader === "string" && originHeader.length > 0) {
		// In production we strictly validate against allowedOrigins.
		// In non-production (local dev) be more permissive but still echo the
		// Origin header so credentialed requests work without exposing '*'.
		const isProd =
			(ctx.env as unknown as { ENVIRONMENT?: string }).ENVIRONMENT ===
			"production";
		const originAllowed = isProd ? allowedOrigins.includes(originHeader) : true;

		if (originAllowed) {
			// Only allow the specific origin (do NOT echo '*' when credentials are used)
			ctx.header("Access-Control-Allow-Origin", originHeader);
			ctx.header(
				"Access-Control-Allow-Methods",
				"GET, POST, PUT, DELETE, OPTIONS",
			);
			// Allow common headers including CSRF header if present in front-end
			ctx.header(
				"Access-Control-Allow-Headers",
				"Content-Type, Authorization, X-CSRF-Token",
			);
			// Allow cookies to be sent from the allowed origin
			ctx.header("Access-Control-Allow-Credentials", "true");
		}
	}

	// Preflight
	if (ctx.req.method === "OPTIONS") {
		// If origin wasn't allowed above, respond with 204 but without CORS headers.
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

		const userToken = await getSupabaseUserToken(
			env,
			body.email,
			body.password,
		);

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

// Song endpoints using Effect-TS
app.get(
	"/api/songs",
	handleHttpEndpoint(() =>
		// Provide the in-memory service for this effect and assert the final shape
		Effect.provideService(
			SongService,
			createInMemorySongService(),
		)(
			Effect.gen(function* () {
				const songService = yield* SongService;
				return yield* songService.getAll;
			}) as unknown as Effect.Effect<Song[], AppError>,
		),
	),
);

// Helper functions for better composition
const parseJsonBody = (ctx: Context): Effect.Effect<unknown, ValidationError> =>
	Effect.tryPromise({
		try: () => ctx.req.json(),
		catch: () =>
			new ValidationError({ message: "Invalid JSON in request body" }),
	});

const validateCreateSongRequest = (
	body: unknown,
): Effect.Effect<
	Schema.Schema.Type<typeof CreateSongRequestSchema>,
	ValidationError
> =>
	Schema.decodeUnknown(CreateSongRequestSchema)(body).pipe(
		Effect.mapError(
			(error) =>
				new ValidationError({
					message: `Validation failed: ${error.message ?? "Unknown validation error"}`,
				}),
		),
	);

const createSongFactory = (ctx: Context): Effect.Effect<Song, AppError> =>
	Effect.gen(function* () {
		// Parse request body
		const body = yield* parseJsonBody(ctx);

		// Validate request data
		const validatedData: Schema.Schema.Type<typeof CreateSongRequestSchema> =
			(yield* validateCreateSongRequest(body)) as unknown as Schema.Schema.Type<
				typeof CreateSongRequestSchema
			>;

		// Create song using service (provide service for inner effect)
		// Create song using service (provide service for inner effect)
		const newSong = yield* Effect.provideService(
			SongService,
			createInMemorySongService(),
		)(
			Effect.gen(function* () {
				const songService = yield* SongService;
				// validatedData has the shape of CreateSongRequestSchema — pick fields explicitly
				const { title, artist, duration, genre, tags } = validatedData as {
					title: string;
					artist: string;
					duration: number;
					genre?: string;
					tags?: string[];
				};

				// Narrow genre to the MUSIC_GENRES union or undefined
				const allowedGenres = new Set<string>(MUSIC_GENRES);
				let narrowedGenre: (typeof MUSIC_GENRES)[number] | undefined;
				if (
					typeof genre === "string" &&
					genre !== "" &&
					allowedGenres.has(genre)
				) {
					narrowedGenre = genre as (typeof MUSIC_GENRES)[number];
				} else {
					narrowedGenre = undefined;
				}
				return yield* songService.create({
					title,
					artist,
					duration,
					genre: narrowedGenre,
					tags,
					// Would be set after file upload
					fileUrl: "",
					uploadedAt: new Date(),
					// Would come from auth
					userId: "user123",
				});
			}) as unknown as Effect.Effect<Song, AppError>,
		);

		return newSong;
	});

app.post("/api/songs", handleHttpEndpoint(createSongFactory));

app.get(
	"/api/songs/:id",
	handleHttpEndpoint((ctx) =>
		Effect.gen(function* () {
			const id = ctx.req.param("id");
			return yield* Effect.provideService(
				SongService,
				createInMemorySongService(),
			)(
				Effect.gen(function* () {
					const songService = yield* SongService;
					return yield* songService.getById(id);
				}) as unknown as Effect.Effect<Song, AppError>,
			);
		}),
	),
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
		// Clear the userSession cookie by setting an expired cookie on the response
		// Mirror attributes used when setting the cookie so the browser will accept
		// the removal. Do not include Domain here to match how the cookie is set in dev.
		const cookieValue = `${"userSession"}=; HttpOnly; Path=/; Max-Age=0;`;
		ctx.header("Set-Cookie", cookieValue);
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

export default app;
