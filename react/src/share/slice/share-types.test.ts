/**
 * share-types exports only TypeScript types.
 * This test ensures the module loads without error.
 */
import { describe, expect, it } from "vitest";

describe("share types", () => {
	it("module loads without error", async () => {
		await expect(import("./share-types")).resolves.toBeDefined();
	});
});
