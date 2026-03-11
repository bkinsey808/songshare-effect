import { describe, expect, it } from "vitest";

import assertPathExists from "./assertPathExists";

describe("assertPathExists", () => {
	it("does not throw when path exists", () => {
		expect(() => {
			assertPathExists({ path: ".", errorMessage: "Path not found" });
		}).not.toThrow();
	});

	it("throws with error message when path does not exist", () => {
		const nonexistent = "/nonexistent-path-that-does-not-exist-12345";

		expect(() => {
			assertPathExists({ path: nonexistent, errorMessage: "Path not found" });
		}).toThrow("Path not found");
	});
});
