import { describe, expect, it } from "vitest";

import detectTypeGpu from "./detectTypeGpu";

describe("detectTypeGpu", () => {
	it("returns a boolean", async () => {
		const res = await detectTypeGpu();
		expect(typeof res).toBe("boolean");
	});
});
