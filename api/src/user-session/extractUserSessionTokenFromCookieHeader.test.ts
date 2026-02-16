import { describe, expect, it } from "vitest";

import { userSessionCookieName } from "@/api/cookie/cookie";

import extractUserSessionTokenFromCookieHeader from "./extractUserSessionTokenFromCookieHeader";

describe("extractUserSessionTokenFromCookieHeader", () => {
	it("returns undefined when Cookie header is undefined", () => {
		expect(extractUserSessionTokenFromCookieHeader(undefined)).toBeUndefined();
	});

	it("returns undefined when Cookie header does not contain the session cookie", () => {
		const header = "other=1; another=two";
		expect(extractUserSessionTokenFromCookieHeader(header)).toBeUndefined();
	});

	it("returns undefined when session cookie is present but value is empty", () => {
		const header = `${userSessionCookieName}=`;
		expect(extractUserSessionTokenFromCookieHeader(header)).toBeUndefined();
	});

	it("returns the token when session cookie is present", () => {
		const token = "abc.def.ghi";
		const header = `${userSessionCookieName}=${token}`;
		expect(extractUserSessionTokenFromCookieHeader(header)).toBe(token);
	});

	it("extracts the session token when multiple cookies are present", () => {
		const token = "token-with-dots.and_chars";
		const header = `foo=bar; ${userSessionCookieName}=${token}; z=1`;
		expect(extractUserSessionTokenFromCookieHeader(header)).toBe(token);
	});

	it("returns the exact cookie value when a similarly-named cookie appears earlier", () => {
		const token = "real-token";
		const header = `not${userSessionCookieName}=not-the-one; ${userSessionCookieName}=${token}`;
		expect(extractUserSessionTokenFromCookieHeader(header)).toBe(token);
	});
});
