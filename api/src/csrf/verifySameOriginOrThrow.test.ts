import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import getAllowedOrigins from "@/api/cors/getAllowedOrigins";
import getOriginToCheck from "@/api/cors/getOriginToCheck";

import type { ReadonlyContext } from "../hono/ReadonlyContext.type";

import verifySameOriginOrThrow from "./verifySameOriginOrThrow";

// mock the two helper modules used internally
vi.mock("@/api/cors/getAllowedOrigins");
vi.mock("@/api/cors/getOriginToCheck");

const mockedGetAllowedOrigins = vi.mocked(getAllowedOrigins);
const mockedGetOriginToCheck = vi.mocked(getOriginToCheck);

/**
 * Minimal wrapper returning a `ReadonlyContext` stub.  Only the cast line is
 * allowed to bypass lint rules.
 */
function makeCtx(): ReadonlyContext {
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
	return {} as unknown as ReadonlyContext;
}

describe("verifySameOriginOrThrow", () => {
	it("throws when origin header is missing or empty", () => {
		mockedGetAllowedOrigins.mockReturnValue(["https://foo.example"]);
		mockedGetOriginToCheck.mockReturnValue("");

		expect(() => {
			verifySameOriginOrThrow(makeCtx());
		}).toThrow(AuthenticationError);
		expect(() => {
			verifySameOriginOrThrow(makeCtx());
		}).toThrow("Missing Origin or Referer header");
	});

	it("throws when origin is not allowed", () => {
		mockedGetAllowedOrigins.mockReturnValue(["https://foo.example"]);
		mockedGetOriginToCheck.mockReturnValue("https://evil.com");

		expect(() => {
			verifySameOriginOrThrow(makeCtx());
		}).toThrow(AuthenticationError);
		expect(() => {
			verifySameOriginOrThrow(makeCtx());
		}).toThrow("CSRF validation failed: origin not allowed");
	});

	it("does not throw for an allowed origin", () => {
		mockedGetAllowedOrigins.mockReturnValue(["https://safe.org"]);
		mockedGetOriginToCheck.mockReturnValue("https://safe.org");

		expect(() => {
			verifySameOriginOrThrow(makeCtx());
		}).not.toThrow();
	});
});
