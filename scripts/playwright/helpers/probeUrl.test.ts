import { describe, it, expect, vi } from "vitest";

import { EXIT_SUCCESS } from "./constants";
// Tests use dynamic import to mock spawnSyncShell before loading probeUrl.

// Non-success code used in tests (keeps tests explicit and avoids magic numbers)
const NON_SUCCESS = 2;

describe("probeUrl", () => {
	it("returns true when spawnSyncShell indicates success", async () => {
		vi.resetAllMocks();
		const spawn = await import("./spawnSyncShell");
		const spy = vi.spyOn(spawn, "default");
		spy.mockImplementation(() => EXIT_SUCCESS);

		const { default: probeUrl } = await import("./probeUrl");
		expect(probeUrl("http://example.test")).toBe(true);
	});

	it("returns false when spawnSyncShell indicates failure", async () => {
		vi.resetAllMocks();
		const spawn = await import("./spawnSyncShell");
		const spy = vi.spyOn(spawn, "default");
		spy.mockImplementation(() => NON_SUCCESS);

		const { default: probeUrl } = await import("./probeUrl");
		expect(probeUrl("https://example.test")).toBe(false);
	});

	it("returns false when spawnSyncShell throws", async () => {
		vi.resetAllMocks();
		const spawn = await import("./spawnSyncShell");
		const spy = vi.spyOn(spawn, "default");
		spy.mockImplementation(() => {
			throw new Error("boom");
		});

		const { default: probeUrl } = await import("./probeUrl");
		expect(probeUrl("http://example.test")).toBe(false);
	});
});
