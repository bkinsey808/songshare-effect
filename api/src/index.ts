import { Effect, Schema } from "effect";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";

import { type AppError, ValidationError } from "./errors";
import { handleHttpEndpoint } from "./http-utils";
import { CreateSongRequestSchema, type Song } from "./schemas";
import { InMemorySongServiceLive, SongService } from "./services.js";

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
