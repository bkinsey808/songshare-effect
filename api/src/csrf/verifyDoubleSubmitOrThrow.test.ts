/**
 * Unit tests for CSRF double‑submit validation helper.
 *
 * All combinations of missing/empty/mismatched header and cookie values are
 * exercised; a matching pair must not throw.
 */

import { describe, expect, it } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import { csrfTokenCookieName } from "@/shared/cookies";

import verifyDoubleSubmitOrThrow from "./verifyDoubleSubmitOrThrow";

/**
 * Construct a tiny read-only Hono request context containing only the fields
 * read by `verifyDoubleSubmitOrThrow`.
 *
 * @param headerValue - value to return from `req.header("X-CSRF-Token")`
 * @param cookieValue - value to embed in the `Cookie` header
 * @returns a partial `ReadonlyContext` suitable for passing to the validator
 */
function makeTestCtx(
	headerValue: string | undefined,
	cookieValue: string | undefined,
): ReturnType<typeof makeCtx> {
	const headers: Record<string, string> = {};
	if (headerValue !== undefined) {
		headers["X-CSRF-Token"] = headerValue;
	}
	if (cookieValue !== undefined) {
		headers["Cookie"] = `${csrfTokenCookieName}=${cookieValue}`;
	}

	return makeCtx({ headers });
}

describe("verifyDoubleSubmitOrThrow", () => {
	it("throws when header is missing", () => {
		expect(() => {
			verifyDoubleSubmitOrThrow(makeTestCtx(undefined, "foo"));
		}).toThrow(AuthenticationError);
		expect(() => {
			verifyDoubleSubmitOrThrow(makeTestCtx(undefined, "foo"));
		}).toThrow("Missing X-CSRF-Token header");
	});

	it("throws when header is empty string", () => {
		expect(() => {
			verifyDoubleSubmitOrThrow(makeTestCtx("", "foo"));
		}).toThrow(AuthenticationError);
		expect(() => {
			verifyDoubleSubmitOrThrow(makeTestCtx("", "foo"));
		}).toThrow("Missing X-CSRF-Token header");
	});

	it("throws when cookie is missing", () => {
		expect(() => {
			verifyDoubleSubmitOrThrow(makeTestCtx("bar", undefined));
		}).toThrow(AuthenticationError);
		expect(() => {
			verifyDoubleSubmitOrThrow(makeTestCtx("bar", undefined));
		}).toThrow("Missing CSRF token cookie");
	});

	it("throws when cookie value is empty string", () => {
		expect(() => {
			verifyDoubleSubmitOrThrow(makeTestCtx("bar", ""));
		}).toThrow(AuthenticationError);
		expect(() => {
			verifyDoubleSubmitOrThrow(makeTestCtx("bar", ""));
		}).toThrow("Missing CSRF token cookie");
	});

	it("throws when header and cookie mismatch", () => {
		expect(() => {
			verifyDoubleSubmitOrThrow(makeTestCtx("a", "b"));
		}).toThrow(AuthenticationError);
		expect(() => {
			verifyDoubleSubmitOrThrow(makeTestCtx("a", "b"));
		}).toThrow("Invalid CSRF token");
	});

	it("does not throw when header and cookie match", () => {
		expect(() => {
			verifyDoubleSubmitOrThrow(makeTestCtx("same", "same"));
		}).not.toThrow();
	});
});
