import { Effect, Schema } from "effect";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";

import { type AppError, ValidationError } from "./errors";
import { handleHttpEndpoint } from "./http-utils";
import { CreateSongRequestSchema, type Song } from "./schemas";
import { SongService, createInMemorySongService } from "./services";
import {
	getSupabaseClientToken,
	getSupabaseUserToken,
} from "./supabaseClientToken";
import { MUSIC_GENRES } from "@/shared/utils/constants";

// For individual file check - R2Bucket type is available in project context
// type R2Bucket = unknown;

type Bindings = {
	BUCKET: R2Bucket;
	ENVIRONMENT: string;
};

const app: Hono<{ Bindings: Bindings }> = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use(
	"*",
	cors({
		origin: [
			"http://localhost:5173",
			"http://localhost:5174",
			"http://localhost:3000",
			"https://your-pages-domain.pages.dev",
		],
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
	}),
);

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

export default app;
