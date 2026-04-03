import { createClient } from "@supabase/supabase-js";
import type { Context } from "hono";
import { describe, expect, it, vi } from "vitest";

import type { Bindings } from "@/api/env";
import forceCast from "@/shared/test-utils/forceCast.test-util";
import {
	HTTP_BAD_REQUEST,
	HTTP_INTERNAL,
	HTTP_NOT_FOUND,
	HTTP_TEMP_REDIRECT,
} from "@/shared/constants/http";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

import imageServe from "./imageServe";

vi.mock("@supabase/supabase-js");

const SAMPLE_URL = "https://cdn.supabase.co/storage/...";
const SAMPLE_KEY = "images/user/img-1.png";

/**
 * Helper to create a Hono context for image tests.
 * @param opts - Options to customize the context.
 * @returns A mock Hono context.
 */
function makeCtx(opts: {
	imageKey?: string;
	storageBackend?: string;
	bucket?: { get: (key: string) => Promise<unknown> } | undefined;
}): Context<{ Bindings: Bindings }> {
	const env = forceCast({
		VITE_SUPABASE_URL: "https://supabase.example",
		SUPABASE_SERVICE_KEY: "key",
		STORAGE_BACKEND: opts.storageBackend ?? "supabase",
		BUCKET: opts.bucket,
	});
	return forceCast<Context<{ Bindings: Bindings }>>({
		req: { param: (name: string) => (name === "*" ? (opts.imageKey ?? "") : "") },
		env,
		json: (body: unknown, status: number) => Response.json(body, { status }),
	});
}

describe("imageServe", () => {
	it("returns 400 when image key is missing", async () => {
		const ctx = makeCtx({ imageKey: "" });
		const res = await imageServe(ctx);
		expect(res.status).toBe(HTTP_BAD_REQUEST);
		await expect(res.json()).resolves.toStrictEqual({ error: "image_key is required" });
	});

	it("returns 400 when image key is whitespace only", async () => {
		const ctx = makeCtx({ imageKey: "   " });
		const res = await imageServe(ctx);
		expect(res.status).toBe(HTTP_BAD_REQUEST);
	});

	it("redirects to Supabase CDN when STORAGE_BACKEND is not r2", async () => {
		const ctx = makeCtx({ imageKey: SAMPLE_KEY });
		const storageFrom = vi.fn().mockReturnValue({
			getPublicUrl: (path: string) => ({ data: { publicUrl: `${SAMPLE_URL}/${path}` } }),
		});
		const fakeClient = forceCast<ReturnType<typeof createClient>>({
			storage: { from: storageFrom },
		});
		vi.mocked(createClient).mockReturnValue(fakeClient);

		const res = await imageServe(ctx);

		expect(res.status).toBe(HTTP_TEMP_REDIRECT);
		expect(res.headers.get("Location")).toContain(SAMPLE_URL);
	});

	it("returns 500 when R2 backend but BUCKET binding is missing", async () => {
		const ctx = makeCtx({ imageKey: SAMPLE_KEY, storageBackend: "r2", bucket: undefined });
		const res = await imageServe(ctx);
		expect(res.status).toBe(HTTP_INTERNAL);
		await expect(res.json()).resolves.toStrictEqual({
			error: "Storage not configured: BUCKET binding is missing",
		});
	});

	it("returns 404 when R2 object not found", async () => {
		const ctx = makeCtx({
			imageKey: SAMPLE_KEY,
			storageBackend: "r2",
			bucket: { get: () => promiseResolved(makeNull()) },
		});
		const res = await imageServe(ctx);
		expect(res.status).toBe(HTTP_NOT_FOUND);
		await expect(res.json()).resolves.toStrictEqual({ error: "Image not found" });
	});
});
