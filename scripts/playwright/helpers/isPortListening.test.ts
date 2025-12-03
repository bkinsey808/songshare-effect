import { describe, it, expect, vi } from "vitest";

import { EXIT_SUCCESS, DEFAULT_PORT } from "./constants";

const NON_SUCCESS = 2;

describe("isPortListening", () => {
	it("returns true if ss finds the port", async () => {
		vi.resetAllMocks();
		const spawn = await import("./spawnSyncShell");
		const spy = vi.spyOn(spawn, "default");
		spy.mockImplementationOnce(() => EXIT_SUCCESS);

		const { default: isPortListening } = await import("./isPortListening");
		expect(isPortListening(DEFAULT_PORT)).toBe(true);
	});

	it("returns true if netstat finds the port but ss doesn't", async () => {
		vi.resetAllMocks();
		const spawn = await import("./spawnSyncShell");
		const spy = vi.spyOn(spawn, "default");
		// ss fails, netstat succeeds
		spy.mockImplementationOnce(() => NON_SUCCESS).mockImplementationOnce(() => EXIT_SUCCESS);

		const { default: isPortListening } = await import("./isPortListening");
		expect(isPortListening(DEFAULT_PORT)).toBe(true);
	});

	it("returns true if nc finds the port after ss/netstat fail", async () => {
		vi.resetAllMocks();
		const spawn = await import("./spawnSyncShell");
		const spy = vi.spyOn(spawn, "default");
		// ss fails, netstat fails, nc succeeds
		spy
			.mockImplementationOnce(() => NON_SUCCESS)
			.mockImplementationOnce(() => NON_SUCCESS)
			.mockImplementationOnce(() => EXIT_SUCCESS);

		const { default: isPortListening } = await import("./isPortListening");
		expect(isPortListening(DEFAULT_PORT)).toBe(true);
	});

	it("returns false if nothing finds the port", async () => {
		vi.resetAllMocks();
		const spawn = await import("./spawnSyncShell");
		const spy = vi.spyOn(spawn, "default");
		spy.mockImplementation(() => NON_SUCCESS);

		const { default: isPortListening } = await import("./isPortListening");
		expect(isPortListening(DEFAULT_PORT)).toBe(false);
	});
});
