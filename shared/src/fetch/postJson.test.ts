import { describe, expect, it, vi } from "vitest";

import postJson from "./postJson";

describe("postJson", () => {
	it("sends POST with JSON body and credentials", async () => {
		// Arrange
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(undefined, { status: 200 })));

		// Assert
		await expect(postJson("/x", { val: 1 })).resolves.toBeUndefined();

		expect(globalThis.fetch).toHaveBeenCalledWith("/x", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ val: 1 }),
		});
	});

	it("throws server-provided text when response not ok", async () => {
		// Arrange
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad", { status: 500 })));

		// Assert
		await expect(postJson("/x", {})).rejects.toThrow("bad");
	});

	it("throws status message when response.text() is empty", async () => {
		// Arrange
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 418 })));

		// Assert
		await expect(postJson("/x", {})).rejects.toThrow("Request failed (418)");
	});
});
