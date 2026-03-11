import { describe, expect, it, vi } from "vitest";

import { clientDebug, clientError, clientLog, clientWarn } from "./clientLogger";

const SECOND_ARG = 1;

describe("clientLogger", () => {
	it("clientDebug forwards to console.debug", () => {
		const spy = vi.spyOn(console, "debug").mockImplementation(() => undefined);
		clientDebug("msg", SECOND_ARG);
		expect(spy).toHaveBeenCalledWith("msg", SECOND_ARG);
		spy.mockRestore();
	});

	it("clientLog forwards to console.log", () => {
		const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
		clientLog("info");
		expect(spy).toHaveBeenCalledWith("info");
		spy.mockRestore();
	});

	it("clientWarn forwards to console.warn", () => {
		const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		clientWarn("warning");
		expect(spy).toHaveBeenCalledWith("warning");
		spy.mockRestore();
	});

	it("clientError forwards to console.error", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		clientError("error");
		expect(spy).toHaveBeenCalledWith("error");
		spy.mockRestore();
	});
});
