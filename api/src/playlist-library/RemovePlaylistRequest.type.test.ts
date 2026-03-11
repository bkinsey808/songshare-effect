import { describe, expect, it } from "vitest";

describe("removePlaylistRequest type", () => {
	it("module loads without error", async () => {
		await expect(import("./RemovePlaylistRequest.type")).resolves.toBeDefined();
	});
});
