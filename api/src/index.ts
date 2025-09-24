import { Hono } from "hono";
import { cors } from "hono/cors";

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

// Songs API routes
app.get("/api/songs", async (c) => {
	// TODO: Implement song listing
	return c.json([
		{ id: 1, title: "Sample Song", artist: "Sample Artist", duration: 180 },
		{ id: 2, title: "Another Song", artist: "Another Artist", duration: 210 },
	]);
});

app.post("/api/songs", async (c) => {
	// TODO: Implement song creation
	const body = await c.req.json();
	return c.json(
		{
			message: "Song created",
			song: { id: Date.now(), ...body },
		},
		201,
	);
});

app.get("/api/songs/:id", async (c) => {
	const id = c.req.param("id");
	// TODO: Implement individual song retrieval
	return c.json({
		id: parseInt(id),
		title: "Sample Song",
		artist: "Sample Artist",
		duration: 180,
	});
});

// File upload endpoint
app.post("/api/upload", async (c) => {
	// TODO: Implement file upload to R2
	return c.json({ message: "Upload endpoint - to be implemented" });
});

export default app;
