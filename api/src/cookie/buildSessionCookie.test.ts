import { describe, expect, it, vi } from "vitest";

import buildSetCookieHeader from "@/api/cookie/buildSetCookieHeader";
import makeCtx from "@/api/hono/makeCtx.test-util";

import buildSessionCookie from "./buildSessionCookie";

vi.mock("@/api/cookie/buildSetCookieHeader");

describe("buildSessionCookie", () => {
	it("forwards params to buildSetCookieHeader and returns its value", () => {
		vi.resetAllMocks();

		const ctx = makeCtx();
		vi.mocked(buildSetCookieHeader).mockReturnValue("session=abc; Max-Age=3600;");

		const res = buildSessionCookie({ ctx, name: "session", value: "abc", opts: { maxAge: 3600 } });

		expect(res).toBe("session=abc; Max-Age=3600;");
		expect(vi.mocked(buildSetCookieHeader)).toHaveBeenCalledWith({
			ctx,
			name: "session",
			value: "abc",
			opts: { maxAge: 3600 },
		});
	});
});
