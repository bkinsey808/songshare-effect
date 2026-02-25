/**
 * Unit tests for CSRF double‑submit validation helper.
 *
 * All combinations of missing/empty/mismatched header and cookie values are
 * exercised; a matching pair must not throw.
 */

import { Headers } from "node-fetch";
import { describe, expect, it } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import { csrfTokenCookieName } from "@/shared/cookies";

import type { ReadonlyContext } from "../hono/ReadonlyContext.type";

import verifyDoubleSubmitOrThrow from "./verifyDoubleSubmitOrThrow";

/**
 * Construct a tiny read-only Hono request context containing only the fields
 * read by `verifyDoubleSubmitOrThrow`.  This avoids pulling in the full
 * `Context` implementation while keeping the helper strongly typed.
 *
 * @param headerValue - value to return from `req.header("X-CSRF-Token")`
 * @param cookieValue - value to embed in the `Cookie` header under the
 *   configured `csrfTokenCookieName` (omits header when `undefined`)
 * @returns a partial `ReadonlyContext` suitable for passing to the validator
 */
function makeCtx(
	headerValue: string | undefined,
	cookieValue: string | undefined,
): ReadonlyContext {
	const headers = new Headers();
	if (cookieValue !== undefined) {
		headers.set("Cookie", `${csrfTokenCookieName}=${cookieValue}`);
	}

	// build minimal object and coerce to ReadonlyContext. disable warnings
	// only on the cast expression so our helper is the only code touching
	// untyped values.
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
	const ctx = {
		req: {
			header: (_name: string) => headerValue,
			raw: {
				headers,
			},
		},
	} as unknown as ReadonlyContext;
	return ctx;
}

describe("verifyDoubleSubmitOrThrow", () => {
	it("throws when header is missing", () => {
		expect(() => {
			verifyDoubleSubmitOrThrow(makeCtx(undefined, "foo"));
		}).toThrow(AuthenticationError);
		expect(() => {
			verifyDoubleSubmitOrThrow(makeCtx(undefined, "foo"));
		}).toThrow("Missing X-CSRF-Token header");
	});

	it("throws when header is empty string", () => {
		expect(() => {
			verifyDoubleSubmitOrThrow(makeCtx("", "foo"));
		}).toThrow(AuthenticationError);
		expect(() => {
			verifyDoubleSubmitOrThrow(makeCtx("", "foo"));
		}).toThrow("Missing X-CSRF-Token header");
	});

	it("throws when cookie is missing", () => {
		// the makeCtx helper will not set a Cookie header when cookieValue is
		// undefined, causing getCookie to return undefined
		expect(() => {
			verifyDoubleSubmitOrThrow(makeCtx("bar", undefined));
		}).toThrow(AuthenticationError);
		expect(() => {
			verifyDoubleSubmitOrThrow(makeCtx("bar", undefined));
		}).toThrow("Missing CSRF token cookie");
	});

	it("throws when cookie value is empty string", () => {
		expect(() => {
			verifyDoubleSubmitOrThrow(makeCtx("bar", ""));
		}).toThrow(AuthenticationError);
		expect(() => {
			verifyDoubleSubmitOrThrow(makeCtx("bar", ""));
		}).toThrow("Missing CSRF token cookie");
	});

	it("throws when header and cookie mismatch", () => {
		expect(() => {
			verifyDoubleSubmitOrThrow(makeCtx("a", "b"));
		}).toThrow(AuthenticationError);
		expect(() => {
			verifyDoubleSubmitOrThrow(makeCtx("a", "b"));
		}).toThrow("Invalid CSRF token");
	});

	it("does not throw when header and cookie match", () => {
		expect(() => {
			verifyDoubleSubmitOrThrow(makeCtx("same", "same"));
		}).not.toThrow();
	});
});
