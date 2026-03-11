/**
 * AddPlaylistRequest.type exports only a TypeScript type.
 * This test ensures the module loads without error.
 */
import { describe, expect, it } from "vitest";

describe("addPlaylistRequest type", () => {
	it("module loads without error", async () => {
		await expect(import("./AddPlaylistRequest.type")).resolves.toBeDefined();
	});
});
