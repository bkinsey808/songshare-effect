import { Hono } from "hono";
import { cors } from "hono/cors";

import {
	type ApiResponse,
	HTTP_STATUS,
	type Song,
	generateId,
	validateSongData,
} from "../../shared/index.js";

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

// Mock data store (replace with actual database)
const songs: Song[] = [];

// Songs API routes
app.get("/api/songs", async (c) => {
	const response: ApiResponse<Song[]> = {
		success: true,
		data: songs,
	};
	return c.json(response);
});

app.post("/api/songs", async (c) => {
	try {
		const body = (await c.req.json()) as unknown;

		if (!validateSongData(body)) {
			const errorResponse: ApiResponse = {
				success: false,
				error: "Invalid song data",
			};
			return c.json(errorResponse, HTTP_STATUS.BAD_REQUEST);
		}

		const newSong: Song = {
			id: generateId(),
			...body,
			fileUrl: "", // Would be set after file upload
			uploadedAt: new Date(),
			userId: "user123", // Would come from auth
		};

		songs.push(newSong);

		const response: ApiResponse<Song> = {
			success: true,
			data: newSong,
			message: "Song created successfully",
		};

		return c.json(response, HTTP_STATUS.CREATED);
	} catch (_error) {
		const errorResponse: ApiResponse = {
			success: false,
			error: "Failed to create song",
		};
		return c.json(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
	}
});

app.get("/api/songs/:id", async (c) => {
	const id = c.req.param("id");
	const song = songs.find((s) => s.id === id);

	if (!song) {
		const errorResponse: ApiResponse = {
			success: false,
			error: "Song not found",
		};
		return c.json(errorResponse, HTTP_STATUS.NOT_FOUND);
	}

	const response: ApiResponse<Song> = {
		success: true,
		data: song,
	};
	return c.json(response);
});

// File upload endpoint
app.post("/api/upload", async (c) => {
	// TODO: Implement file upload to R2
	return c.json({ message: "Upload endpoint - to be implemented" });
});

export default app;
