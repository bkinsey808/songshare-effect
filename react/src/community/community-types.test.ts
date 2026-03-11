import { describe, expect, it } from "vitest";

describe("community types", () => {
	it("module loads without error", async () => {
		await expect(import("./community-types")).resolves.toBeDefined();
	});
});
