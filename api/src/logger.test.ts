import { describe, expect, it, vi } from "vitest";

import { ONE } from "@/shared/constants/shared-constants";

import { debug, error, log, warn } from "./logger";

/**
 * Runs the given callback and restores all mocks in a finally block.
 * Avoids afterEach for jest/no-hooks while ensuring mocks are cleared after each test.
 */
function withRestoredMocks(fn: () => void): void {
	try {
		fn();
	} finally {
		vi.restoreAllMocks();
	}
}

describe("logger", () => {
	it("log forwards to console.log", () => {
		withRestoredMocks(() => {
			const spy = vi.spyOn(console, "log").mockImplementation(vi.fn());

			log("test message");

			expect(spy).toHaveBeenCalledWith("test message");
		});
	});

	it("debug forwards to console.debug", () => {
		withRestoredMocks(() => {
			const spy = vi.spyOn(console, "debug").mockImplementation(vi.fn());

			debug("debug info");

			expect(spy).toHaveBeenCalledWith("debug info");
		});
	});

	it("warn forwards to console.warn", () => {
		withRestoredMocks(() => {
			const spy = vi.spyOn(console, "warn").mockImplementation(vi.fn());

			warn("warning");

			expect(spy).toHaveBeenCalledWith("warning");
		});
	});

	it("error forwards to console.error", () => {
		withRestoredMocks(() => {
			const spy = vi.spyOn(console, "error").mockImplementation(vi.fn());

			error("error message");

			expect(spy).toHaveBeenCalledWith("error message");
		});
	});

	it("log passes multiple args", () => {
		withRestoredMocks(() => {
			const spy = vi.spyOn(console, "log").mockImplementation(vi.fn());

			log("a", ONE, { key: "value" });

			expect(spy).toHaveBeenCalledWith("a", ONE, { key: "value" });
		});
	});
});
