import { describe, expect, it } from "vitest";

describe("event library types", () => {
	it("module loads without error", async () => {
		await expect(import("./event-library-types")).resolves.toBeDefined();
	});
});
