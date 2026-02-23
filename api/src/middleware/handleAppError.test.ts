import { describe, expect, it, vi } from "vitest";

import { HTTP_INTERNAL } from "@/shared/constants/http";

import handleAppError from "./handleAppError";

// Minimal context stub; middleware doesn't actually inspect it.
const dummyCtx = {} as unknown;

describe("handleAppError", () => {
	it("logs Error instances and returns 500", async () => {
		const loggerMod = await import("@/api/logger");
		const spy = vi.spyOn(loggerMod, "error").mockImplementation(() => undefined);
		const res = handleAppError(new Error("oops"), dummyCtx);

		expect(spy).toHaveBeenCalledWith(
			"[app.onError] Unhandled exception:",
			expect.stringContaining("oops"),
		);
		expect(res.status).toBe(HTTP_INTERNAL); // imported above?
	});

	it("logs non-Error values", async () => {
		const loggerMod = await import("@/api/logger");
		const spy = vi.spyOn(loggerMod, "error").mockImplementation(() => undefined);
		const res = handleAppError("plain", dummyCtx);

		expect(spy).toHaveBeenCalledWith(
			"[app.onError] Unhandled exception (non-Error):",
			expect.any(String),
		);
		expect(res.status).toBe(HTTP_INTERNAL);
	});

	it("swallows logger failures and still returns 500", async () => {
		const loggerMod = await import("@/api/logger");
		vi.spyOn(loggerMod, "error").mockImplementation(() => {
			throw new Error("log fail");
		});
		const res = handleAppError(new Error("boom"), dummyCtx);
		expect(res.status).toBe(HTTP_INTERNAL);
	});
});
