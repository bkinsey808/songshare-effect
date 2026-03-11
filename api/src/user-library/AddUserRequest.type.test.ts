import { describe, expect, it } from "vitest";

describe("addUserRequest type", () => {
	it("module loads without error", async () => {
		await expect(import("./AddUserRequest.type")).resolves.toBeDefined();
	});
});
