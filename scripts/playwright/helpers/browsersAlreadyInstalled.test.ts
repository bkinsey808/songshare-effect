import { describe, it, expect, vi, beforeEach } from "vitest";

describe("browsersAlreadyInstalled", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.resetModules();
	});

	it("returns false if cache dir exists but no executables are found", async () => {
		// Create a real temporary cache directory and set env so the helper checks it
		const fs = await import("node:fs");
		const os = await import("node:os");
		const path = await import("node:path");
		const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "playwright-cache-"));
		try {
			process.env["PLAYWRIGHT_BROWSERS_PATH"] = tmp;

			// Mock findBrowserExecutable to return undefined (no exe found)
			const find = await import("./findBrowserExecutable");
			// Provide an explicit typed implementation so lint/type checks are happy
			vi.spyOn(find, "default").mockImplementation((): string | undefined => undefined);

			const mod = await import("./browsersAlreadyInstalled");
			expect(mod.default()).toBe(false);
		} finally {
			delete process.env["PLAYWRIGHT_BROWSERS_PATH"];
			fs.rmdirSync(tmp, { recursive: true });
		}
	});

	it("returns true when a browser executable is detected", async () => {
		const fs = await import("node:fs");
		const os = await import("node:os");
		const path = await import("node:path");
		const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "playwright-cache-"));
		try {
			process.env["PLAYWRIGHT_BROWSERS_PATH"] = tmp;

			const find = await import("./findBrowserExecutable");
			// Explicit return type avoids unsafe assertion lint rule
			vi.spyOn(find, "default").mockImplementation((): string => "/path/to/exe");

			const mod = await import("./browsersAlreadyInstalled");
			expect(mod.default()).toBe(true);
		} finally {
			delete process.env["PLAYWRIGHT_BROWSERS_PATH"];
			fs.rmdirSync(tmp, { recursive: true });
		}
	});
});
