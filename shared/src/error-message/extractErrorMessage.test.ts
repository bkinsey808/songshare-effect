/* oxlint-disable no-magic-numbers */
import { describe, expect, it } from "vitest";

import extractErrorMessage from "./extractErrorMessage";

describe("extractErrorMessage", () => {
	it("returns fallback when provided for non-record values", () => {
		expect(extractErrorMessage(undefined, "fallback")).toBe("fallback");
		expect(extractErrorMessage(123, "fallback")).toBe("123");
	});

	it("stringifies numbers when no fallback provided", () => {
		expect(extractErrorMessage(123)).toBe("123");
	});

	it("returns undefined when undefined and no fallback provided", () => {
		expect(extractErrorMessage(undefined)).toBeUndefined();
	});

	it("returns error when present even if fallback provided", () => {
		expect(extractErrorMessage({ error: "oops" }, "fallback")).toBe("oops");
	});

	it("returns message when error absent", () => {
		expect(extractErrorMessage({ message: "not found" })).toBe("not found");
	});

	it("returns fallback for non-string fields when provided", () => {
		expect(extractErrorMessage({ error: { code: 1 } }, "fallback")).toBe('{"error":{"code":1}}');
	});

	it("returns error message from Error instances", () => {
		expect(extractErrorMessage(new Error("boom"))).toBe("boom");
	});

	it("returns strings as given", () => {
		expect(extractErrorMessage("plain string")).toBe("plain string");
	});
});
