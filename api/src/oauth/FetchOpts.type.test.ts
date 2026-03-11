import { describe, expect, it } from "vitest";

describe("fetchOpts type", () => {
	it("module loads without error", async () => {
		await expect(import("./FetchOpts.type")).resolves.toBeDefined();
	});
});
