import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { userSessionCookieName } from "@/api/cookie/cookie";
import makeCtx from "@/api/hono/makeCtx.test-util";

import extractUserSessionTokenFromContext from "./extractUserSessionTokenFromContext";

describe("extractUserSessionTokenFromContext", () => {
	it("returns undefined when Cookie header is missing", async () => {
		const ctx = makeCtx();
		const res = await Effect.runPromise(extractUserSessionTokenFromContext(ctx));
		expect(res).toBeUndefined();
	});

	it("returns undefined when session cookie present but empty", async () => {
		const ctx = makeCtx({ headers: { Cookie: `${userSessionCookieName}=` } });
		const res = await Effect.runPromise(extractUserSessionTokenFromContext(ctx));
		expect(res).toBeUndefined();
	});

	it("returns token when session cookie present", async () => {
		const token = "abc.def.ghi";
		const ctx = makeCtx({ headers: { Cookie: `${userSessionCookieName}=${token}` } });
		const res = await Effect.runPromise(extractUserSessionTokenFromContext(ctx));
		expect(res).toBe(token);
	});

	it("extracts token from Cookie header containing multiple cookies", async () => {
		const token = "multi.token.value";
		const header = `x=1; ${userSessionCookieName}=${token}; other=2`;
		const ctx = makeCtx({ headers: { Cookie: header } });
		const res = await Effect.runPromise(extractUserSessionTokenFromContext(ctx));
		expect(res).toBe(token);
	});
});
