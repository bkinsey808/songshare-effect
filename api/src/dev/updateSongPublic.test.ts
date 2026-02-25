import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSimpleSupabaseClient from "@/api/test-utils/makeSimpleSupabaseClient.test-util";
import { HTTP_BAD_REQUEST, HTTP_FORBIDDEN, HTTP_INTERNAL } from "@/shared/constants/http";

import updateSongPublic from "./updateSongPublic";

// supabase client will be mocked in individual tests
vi.mock("@supabase/supabase-js");

describe("updateSongPublic", () => {
	it("returns forbidden when running in production", async () => {
		const ctx = makeCtx({ env: { ENVIRONMENT: "production" } });

		const res = await Effect.runPromise(updateSongPublic(ctx));
		expect(res).toBeInstanceOf(Response);
		expect(res.status).toBe(HTTP_FORBIDDEN);
		await expect(res.json()).resolves.toStrictEqual({ error: "Not allowed in production" });
	});

	it("returns bad request when body not object", async () => {
		const ctx = makeCtx({ body: 42 });
		const res = await Effect.runPromise(updateSongPublic(ctx));
		expect(res.status).toBe(HTTP_BAD_REQUEST);
		await expect(res.json()).resolves.toStrictEqual({ error: "Invalid body" });
	});

	it("returns bad request when song_id missing", async () => {
		const ctx = makeCtx({ body: { foo: "bar" } });
		const res = await Effect.runPromise(updateSongPublic(ctx));
		expect(res.status).toBe(HTTP_BAD_REQUEST);
		await expect(res.json()).resolves.toStrictEqual({ error: "Missing song_id" });
	});

	it("calls supabase and returns success with payload", async () => {
		const fake = makeSimpleSupabaseClient({ result: { song_id: "s1" } });
		vi.mocked(createClient).mockReturnValue(fake);

		const body = { song_id: "s1", song_name: "New", song_slug: "new" };
		const ctx = makeCtx({ body, env: { ENVIRONMENT: "dev" } });

		const res = await Effect.runPromise(updateSongPublic(ctx));
		const HTTP_OK = 200; // local constant to avoid magic-number lint
		expect(res.status).toBe(HTTP_OK);
		await expect(res.json()).resolves.toStrictEqual({ success: true, data: { song_id: "s1" } });
	});

	it("propagates supabase error response", async () => {
		const fake = makeSimpleSupabaseClient({ error: { message: "oops" } });
		vi.mocked(createClient).mockReturnValue(fake);

		const ctx = makeCtx({ body: { song_id: "s1" } });
		const res = await Effect.runPromise(updateSongPublic(ctx));
		expect(res.status).toBe(HTTP_INTERNAL);
		await expect(res.json()).resolves.toStrictEqual({ error: "oops" });
	});

	it("fails when the database call throws", async () => {
		const bad = makeSimpleSupabaseClient({ reject: true, error: new Error("db fail") });
		vi.mocked(createClient).mockReturnValue(bad);

		const ctx = makeCtx({ body: { song_id: "s1" } });
		await expect(Effect.runPromise(updateSongPublic(ctx))).rejects.toThrow(/db fail/);
	});
});
