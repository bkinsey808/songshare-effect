import { describe, expect, it } from "vitest";

import delay from "./delay";

const WAIT_MS = 20;
const MIN_ELAPSED_MS = 10;

describe("delay", () => {
	it("resolves after given ms", async () => {
		const start = Date.now();
		await delay(WAIT_MS);
		const elapsed = Date.now() - start;
		expect(elapsed).toBeGreaterThanOrEqual(MIN_ELAPSED_MS); // allow some leeway
	});
});
