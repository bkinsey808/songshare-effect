import { describe, expect, it } from "vitest";

describe("playlist types", () => {
	it("module loads without error", async () => {
		await expect(import("./playlist-types")).resolves.toBeDefined();
	});
});
