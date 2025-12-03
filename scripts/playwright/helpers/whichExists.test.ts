import { describe, it, expect } from "vitest";

import whichExists from "./whichExists";

describe("whichExists", () => {
	it("detects an existing command (node)", () => {
		const ok = whichExists("node");
		expect(ok).toBe(true);
	});

	it("returns false for a very unlikely command name", () => {
		const ok = whichExists("definitely_not_a_real_cmd_9876");
		expect(ok).toBe(false);
	});
});
