import { describe, it, expect } from "vitest";

import { EXIT_SUCCESS } from "./constants";
import spawnSyncShell from "./spawnSyncShell";

describe("spawnSyncShell", () => {
	it("returns EXIT_SUCCESS for a command that exits 0", () => {
		const code = spawnSyncShell('node -e "process.exit(0)"');
		expect(code).toBe(EXIT_SUCCESS);
	});

	it("returns a non-zero exit code for a failing command", () => {
		const code = spawnSyncShell('node -e "process.exit(5)"');
		expect(typeof code).toBe("number");
		expect(code).not.toBe(EXIT_SUCCESS);
	});

	it("returns a non-zero exit code for a wholly invalid command", () => {
		// Use a very-likely-nonexistent command to force a failure path. Shells
		// commonly return 127 for unknown commands — the exact value isn't
		// important for our helper, we just want a non-zero code.
		const code = spawnSyncShell("definitely_not_a_real_cmd_9876");
		expect(typeof code).toBe("number");
		expect(code).not.toBe(EXIT_SUCCESS);
	});
});
