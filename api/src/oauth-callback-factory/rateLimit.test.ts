import { describe, expect, it } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";

import rateLimit from "./rateLimit";

describe("rateLimit", () => {
	it("resolves to true", async () => {
		const ctx = makeCtx();
		const result = await rateLimit(ctx);
		expect(result).toBe(true);
	});

	it("accepts optional key parameter", async () => {
		const ctx = makeCtx();
		const result = await rateLimit(ctx, "custom-key");
		expect(result).toBe(true);
	});
});
