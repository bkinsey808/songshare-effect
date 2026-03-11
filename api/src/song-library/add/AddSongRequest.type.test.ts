import { describe, expect, it } from "vitest";

describe("addSongRequest type", () => {
	it("module loads without error", async () => {
		await expect(import("./AddSongRequest.type")).resolves.toBeDefined();
	});
});
