import { describe, expect, it } from "vitest";

describe("readonlyDeep type", () => {
	it("module loads without error", async () => {
		await expect(import("./ReadonlyDeep.type")).resolves.toBeDefined();
	});
});
