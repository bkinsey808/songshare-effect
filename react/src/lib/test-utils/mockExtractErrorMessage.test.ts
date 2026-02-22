import { describe, expect, it } from "vitest";

import { mockExtractErrorMessage } from "@/react/lib/test-utils/mockExtractErrorMessage";

/**
 * Sanity helper: module should install a stubbed version of
 * `extractErrorMessage` and return a typed spy.
 */
describe("mockExtractErrorMessage", () => {
	it("provides a simple spy returning err-def", () => {
		const spy = mockExtractErrorMessage();
		expect(spy("foo", "bar")).toBe("foo-bar");
	});
});
