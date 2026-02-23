import { describe, expect, it, vi } from "vitest";

import buildSetCookieHeader from "@/api/cookie/buildSetCookieHeader";
import makeCtx from "@/api/hono/makeCtx.test-util";

import buildClearCookieHeader from "./buildClearCookieHeader";

vi.mock("@/api/cookie/buildSetCookieHeader");

describe("buildClearCookieHeader", () => {
	it("calls buildSetCookieHeader with maxAge=0 and httpOnly=true and returns its value", () => {
		vi.resetAllMocks();

		const ctx = makeCtx();
		vi.mocked(buildSetCookieHeader).mockReturnValue("name=; Max-Age=0; HttpOnly;");

		const res = buildClearCookieHeader(ctx, "session");

		expect(res).toBe("name=; Max-Age=0; HttpOnly;");
		expect(vi.mocked(buildSetCookieHeader)).toHaveBeenCalledWith(
			expect.objectContaining({
				ctx,
				name: "session",
				value: "",
				opts: { maxAge: 0, httpOnly: true },
			}),
		);
	});

	it("propagates errors thrown by buildSetCookieHeader", () => {
		vi.resetAllMocks();

		const ctx = makeCtx();
		vi.mocked(buildSetCookieHeader).mockImplementation(() => {
			throw new Error("boom");
		});

		expect(() => buildClearCookieHeader(ctx, "session")).toThrow(/boom/);
	});
});
