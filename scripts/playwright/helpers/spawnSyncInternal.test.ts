import { describe, it, expect } from "vitest";

import { EXIT_SUCCESS } from "./constants";
import spawnSyncInternal from "./spawnSyncInternal";

describe("spawnSyncInternal", () => {
	it("returns EXIT_SUCCESS for a command that exits 0", () => {
		const code = spawnSyncInternal('node -e "process.exit(0)"');
		expect(typeof code).toBe("number");
		expect(code).toBe(EXIT_SUCCESS);
	});

	it("returns a non-zero exit code for a failing command", () => {
		const code = spawnSyncInternal('node -e "process.exit(42)"');
		expect(typeof code).toBe("number");
		expect(code).not.toBe(EXIT_SUCCESS);
	});
});
