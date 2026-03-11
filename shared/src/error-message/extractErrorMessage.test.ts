import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import extractErrorMessage from "./extractErrorMessage";

const NUM_PRIMITIVE = 42;

describe("extractErrorMessage", () => {
	it("returns undefined for null and undefined when no fallback", () => {
		expect(extractErrorMessage(makeNull())).toBeUndefined();
		expect(extractErrorMessage(undefined)).toBeUndefined();
	});

	it("returns fallback for null and undefined when fallback provided", () => {
		expect(extractErrorMessage(makeNull(), "fallback")).toBe("fallback");
		expect(extractErrorMessage(undefined, "default")).toBe("default");
	});

	it("returns message from Error instance", () => {
		expect(extractErrorMessage(new Error("error msg"))).toBe("error msg");
	});

	it("returns string as-is", () => {
		expect(extractErrorMessage("plain string")).toBe("plain string");
	});

	it("extracts from record error field", () => {
		expect(extractErrorMessage({ error: "API error" })).toBe("API error");
	});

	it("extracts from record message field", () => {
		expect(extractErrorMessage({ message: "Something failed" })).toBe("Something failed");
	});

	it("prefers error over message when both present", () => {
		expect(extractErrorMessage({ error: "err", message: "msg" })).toBe("err");
	});

	it("returns fallback when record has no string error/message", () => {
		expect(extractErrorMessage({}, "fallback")).toBe("fallback");
	});

	it("returns JSON string for record with non-string error when no fallback", () => {
		const payload = { error: { code: 500 } };
		expect(extractErrorMessage(payload)).toBe(JSON.stringify(payload));
	});

	it("converts primitives to string", () => {
		expect(extractErrorMessage(NUM_PRIMITIVE)).toBe("42");
		expect(extractErrorMessage(true)).toBe("true");
	});
});
