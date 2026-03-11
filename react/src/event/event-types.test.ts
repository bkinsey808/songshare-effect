import { describe, expect, it } from "vitest";

describe("event types", () => {
	it("module loads without error", async () => {
		await expect(import("./event-types")).resolves.toBeDefined();
	});
});
