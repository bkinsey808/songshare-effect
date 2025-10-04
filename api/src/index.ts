import { Effect, Schema } from "effect";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";

import { type AppError, ValidationError } from "./errors";
import { handleHttpEndpoint } from "./http-utils";
import { CreateSongRequestSchema, type Song } from "./schemas";
import { InMemorySongServiceLive, SongService } from "./services";
import {
	getSupabaseClientToken,
	getSupabaseUserToken,
} from "./supabaseClientToken";

// For individual file check - R2Bucket type is available in project context
type R2Bucket = unknown;

type Bindings = {
	BUCKET: R2Bucket;
	ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

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
app.get("/health", (c) => {
	return c.json({
		status: "ok",
		environment: c.env.ENVIRONMENT,
		timestamp: new Date().toISOString(),
	});
});

// Supabase client token endpoint - provides a JWT for client-side Supabase operations
app.get("/api/auth/visitor", async (c) => {
	try {
		const env = c.env as unknown as {
			VITE_SUPABASE_URL: string;
			SUPABASE_SERVICE_KEY: string;
			SUPABASE_VISITOR_EMAIL: string;
			SUPABASE_VISITOR_PASSWORD: string;
		};

		const supabaseClientToken = await getSupabaseClientToken(env);

		return c.json({
			access_token: supabaseClientToken,
			token_type: "bearer",
			expires_in: 3600, // 1 hour
		});
	} catch (error) {
		console.error("Failed to generate Supabase client token:", error);
		return c.json({ error: "Failed to generate Supabase client token" }, 500);
	}
});

// User authentication endpoint - provides a JWT for authenticated user operations
app.post("/api/auth/user", async (c) => {
	try {
		const body = (await c.req.json()) as { email: string; password: string };

		if (!body.email || !body.password) {
			return c.json({ error: "Email and password are required" }, 400);
		}

		const env = c.env as unknown as {
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

		return c.json({
			access_token: userToken,
			token_type: "bearer",
			expires_in: 3600, // 1 hour
		});
	} catch (error) {
		console.error("Failed to authenticate user:", error);
		return c.json({ error: "Authentication failed" }, 401);
	}
});

// Song endpoints using Effect-TS
app.get(
	"/api/songs",
	handleHttpEndpoint(() =>
		Effect.gen(function* () {
			const songService = yield* Effect.provide(
				SongService,
				InMemorySongServiceLive,
			);
			return yield* songService.getAll;
		}),
	),
);

// Helper functions for better composition
const parseJsonBody = (c: Context): Effect.Effect<unknown, ValidationError> =>
	Effect.tryPromise({
		try: () => c.req.json(),
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

const createSongFactory = (c: Context): Effect.Effect<Song, AppError> =>
	Effect.gen(function* () {
		// Parse request body
		const body = yield* parseJsonBody(c);

		// Validate request data
		const validatedData = yield* validateCreateSongRequest(body);

		// Create song using service
		const songService = yield* Effect.provide(
			SongService,
			InMemorySongServiceLive,
		);
		const newSong = yield* songService.create({
			...validatedData,
			fileUrl: "", // Would be set after file upload
			uploadedAt: new Date(),
			userId: "user123", // Would come from auth
		});

		return newSong;
	});

app.post("/api/songs", handleHttpEndpoint(createSongFactory));

app.get(
	"/api/songs/:id",
	handleHttpEndpoint((c) =>
		Effect.gen(function* () {
			const id = c.req.param("id");
			const songService = yield* Effect.provide(
				SongService,
				InMemorySongServiceLive,
			);
			return yield* songService.getById(id);
		}),
	),
);

// File upload endpoint
app.post("/api/upload", async (c) => {
	// TODO: Implement file upload to R2 using Effect
	return c.json({ message: "Upload endpoint - to be implemented" });
});

export default app;
