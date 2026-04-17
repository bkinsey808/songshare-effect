import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import { HTTP_FORBIDDEN, HTTP_OK } from "@/shared/constants/http";

import updateSongPublic from "./updateSongPublic";
import updateSongPublicHandler from "./updateSongPublicHandler";

vi.mock("./updateSongPublic");

describe("updateSongPublicHandler", () => {
	it("returns 403 when ENVIRONMENT is production", async () => {
		const ctx = makeCtx({
			body: { song_id: "song-1" },
			env: { ENVIRONMENT: "production" },
		});

		const resp = await Effect.runPromise(updateSongPublicHandler(ctx));

		expect(resp.status).toBe(HTTP_FORBIDDEN);
		const json = await resp.json();
		expect(json).toHaveProperty("error", "Not allowed in production");
		expect(vi.mocked(updateSongPublic)).not.toHaveBeenCalled();
	});

	it("delegates to updateSongPublic when not production", async () => {
		vi.mocked(updateSongPublic).mockReturnValue(
			Effect.succeed(Response.json({ success: true }, { status: HTTP_OK })),
		);

		const ctx = makeCtx({
			body: { song_id: "song-1" },
			env: {
				ENVIRONMENT: "development",
				VITE_SUPABASE_URL: "https://x.supabase.co",
				SUPABASE_SERVICE_KEY: "key",
			},
		});

		const resp = await Effect.runPromise(updateSongPublicHandler(ctx));

		expect(resp.status).toBe(HTTP_OK);
		expect(vi.mocked(updateSongPublic)).toHaveBeenCalledWith(ctx);
	});
});
