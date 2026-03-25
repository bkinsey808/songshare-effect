import { describe, expect, it } from "vitest";

import delay from "./delay";

const WAIT_MS = 20;
const MIN_ELAPSED_MS = 10;

describe("delay", () => {
	it("resolves after given ms", async () => {
		// Arrange
		const start = Date.now();

		// Act
		await delay(WAIT_MS);

		// Assert
		const elapsed = Date.now() - start;
		expect(elapsed).toBeGreaterThanOrEqual(MIN_ELAPSED_MS); // allow some leeway
	});
});
