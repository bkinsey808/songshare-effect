import { it, expect } from "vitest";

import detectTypeGpu from "./detectTypeGpu";

it("returns a boolean", async () => {
	const res = await detectTypeGpu();
	expect(typeof res).toBe("boolean");
});
