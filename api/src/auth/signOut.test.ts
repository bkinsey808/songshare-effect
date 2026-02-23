import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import buildClearCookieHeader from "@/api/cookie/buildClearCookieHeader";
import { userSessionCookieName } from "@/api/cookie/cookie";
import verifySameOriginOrThrow from "@/api/csrf/verifySameOriginOrThrow";
import makeCtx from "@/api/hono/makeCtx.test-util";
import { HTTP_INTERNAL } from "@/shared/constants/http";

import signOutHandler from "./signOut";

vi.mock("@/api/cookie/buildClearCookieHeader");
vi.mock("@/api/csrf/verifySameOriginOrThrow");

describe("signOutHandler", () => {
	it("clears session cookie and returns success (happy path)", () => {
		vi.resetAllMocks();

		const appendSpy = vi.fn();
		const ctx = makeCtx({ resHeadersAppend: appendSpy });

		vi.mocked(verifySameOriginOrThrow).mockReturnValue(undefined);
		vi.mocked(buildClearCookieHeader).mockReturnValue("clear-cookie");

		const res = signOutHandler(ctx);

		expect(res).toStrictEqual({ success: true });
		expect(appendSpy).toHaveBeenCalledWith("Set-Cookie", "clear-cookie");
		expect(vi.mocked(buildClearCookieHeader)).toHaveBeenCalledWith(ctx, userSessionCookieName);
	});

	it("returns 500 Response when CSRF check throws", async () => {
		vi.resetAllMocks();

		const appendSpy = vi.fn();
		const ctx = makeCtx({ resHeadersAppend: appendSpy });

		vi.mocked(verifySameOriginOrThrow).mockImplementation(() => {
			throw new AuthenticationError({ message: "Invalid origin" });
		});

		const res = signOutHandler(ctx);
		expect(res).toBeInstanceOf(Response);
		expect(res.status).toBe(HTTP_INTERNAL);
		const body = await res.json();
		expect(body).toStrictEqual({ error: "failed" });
		expect(appendSpy).not.toHaveBeenCalled();
	});

	it("returns 500 Response when clearing cookie header builder throws", async () => {
		vi.resetAllMocks();

		const appendSpy = vi.fn();
		const ctx = makeCtx({ resHeadersAppend: appendSpy });

		vi.mocked(verifySameOriginOrThrow).mockReturnValue(undefined);
		vi.mocked(buildClearCookieHeader).mockImplementation(() => {
			throw new Error("cookie failed");
		});

		const res = signOutHandler(ctx);
		expect(res).toBeInstanceOf(Response);
		expect(res.status).toBe(HTTP_INTERNAL);
		const body = await res.json();
		expect(body).toStrictEqual({ error: "failed" });
		expect(appendSpy).not.toHaveBeenCalled();
	});
});
