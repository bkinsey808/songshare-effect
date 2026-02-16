import { describe, expect, it, vi } from "vitest";

import makeCtx from "./makeCtx.mock";

describe("makeCtx helper", () => {
	it("returns default env values and default request body", async () => {
		const ctx = makeCtx();

		expect(ctx.env.JWT_SECRET).toBe("jwt-secret");
		expect(typeof ctx.req.json).toBe("function");
		await expect(ctx.req.json()).resolves.toStrictEqual({ username: "new-user" });
		expect(typeof ctx.req.header).toBe("function");
	});

	it("respects overrides: headers, env and resHeadersAppend spy", async () => {
		vi.resetAllMocks();

		const appendSpy = vi.fn();
		const ctx = makeCtx({
			body: { foo: "bar" },
			env: { JWT_SECRET: "custom-secret" },
			headers: { "x-test-header": "x-val" },
			resHeadersAppend: appendSpy,
		});

		expect(ctx.env.JWT_SECRET).toBe("custom-secret");
		await expect(ctx.req.json()).resolves.toStrictEqual({ foo: "bar" });
		expect(ctx.req.header("x-test-header")).toBe("x-val");

		// ensure res.headers.append uses the provided spy
		ctx.res.headers.append("Set-Cookie", "a=1");
		expect(appendSpy).toHaveBeenCalledWith("Set-Cookie", "a=1");
	});

	it("req.json rejects when body option is Error", async () => {
		const ctx = makeCtx({ body: new Error("bad json") });
		await expect(ctx.req.json()).rejects.toThrow(/bad json/);
	});
});
