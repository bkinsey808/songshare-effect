/* oxlint-disable no-magic-numbers */
import { describe, expect, it } from "vitest";

import extractErrorStack from "./extractErrorStack";

describe("extractErrorStack", () => {
	it("returns stack from Error instances", () => {
		const err = new Error("boom");
		err.stack = "boom-stack";
		expect(extractErrorStack(err)).toBe("boom-stack");
	});

	it("returns stack from record payloads", () => {
		expect(extractErrorStack({ stack: "some-stack" })).toBe("some-stack");
	});

	it("returns fallback when no stack present", () => {
		expect(extractErrorStack({})).toBe("No stack trace");
		expect(extractErrorStack(undefined, "fallback")).toBe("fallback");
	});
});
