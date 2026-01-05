import { spawnSync } from "node:child_process";
import { createInterface, type Interface } from "node:readline/promises";
import { describe, it, expect, vi } from "vitest";

import { error, warn } from "../../utils/scriptLogger";
import maybePrompt from "./maybePromptInstallDeps";

/**
 * Resolution for oxlint and tsc errors without disable statements or dynamic imports:
 *
 * 1. Static Imports: Used standard `import` statements at the top level instead of `import()` within tests.
 *    This allows us to use the imported types in the mock factory definitions.
 *
 * 2. Typed Mock Factory: Explicitly typed the return value of the factory function passed to `vi.mock`.
 *    Instead of `vi.mock<T>(...)` which requires `import("...")` as the first argument (dynamic import style),
 *    we use `vi.mock("path", (): Type => { ... })`. The `Type` is constructed using `typeof importName`
 *    from the static imports. This satisfies `oxlint`'s requirement for a typed mock factory and
 *    TypeScript's requirement for matching the string overload signature.
 *
 * 3. Mocking Exports: Ensured both default and named exports were mocked correctly (e.g. `createInterface`
 *    for `readline`) to match the module structure expected by the implementation.
 */

const NON_ZERO = 1;

vi.mock(
	"node:child_process",
	(): {
		spawnSync: typeof spawnSync;
		default: { spawnSync: typeof spawnSync };
	} => {
		const spawn = vi.fn();
		return { spawnSync: spawn, default: { spawnSync: spawn } };
	},
);

vi.mock(
	"node:readline/promises",
	(): {
		createInterface: typeof createInterface;
		default: { createInterface: typeof createInterface };
	} => {
		const create = vi.fn();
		return { createInterface: create, default: { createInterface: create } }; // Mock named and default export
	},
);

vi.mock(
	"../../utils/scriptLogger",
	(): {
		warn: typeof warn;
		error: typeof error;
	} => {
		const warn = vi.fn();
		const error = vi.fn();
		return { warn, error }; // Mock named exports
	},
);

describe("maybePromptInstallDeps", () => {
	it("logs a warning for non-interactive environment (stdin not a TTY)", async () => {
		vi.resetAllMocks();

		const prevStdinTTY = process.stdin.isTTY;
		const prevStdoutTTY = process.stdout.isTTY;
		try {
			// Make stdin non-interactive
			process.stdin.isTTY = false;
			// stdout can be either

			const spawnMock = vi.mocked(spawnSync);
			const warnMock = vi.mocked(warn);

			await maybePrompt(false, "/fake/exe/path");

			expect(spawnMock).not.toHaveBeenCalled();
			expect(warnMock).toHaveBeenCalledWith(expect.stringContaining("Non-interactive postinstall"));
		} finally {
			// restore TTY flags
			process.stdin.isTTY = prevStdinTTY;
			process.stdout.isTTY = prevStdoutTTY;
		}
	});

	it("logs a warning when running in CI even if TTYs are present", async () => {
		vi.resetAllMocks();

		const prevStdinTTY = process.stdin.isTTY;
		const prevStdoutTTY = process.stdout.isTTY;
		try {
			// Make both TTY true to test that isCI dominates
			process.stdin.isTTY = true;
			process.stdout.isTTY = true;

			const spawnMock = vi.mocked(spawnSync);
			const warnMock = vi.mocked(warn);

			await maybePrompt(true, "/fake/exe/path");

			expect(spawnMock).not.toHaveBeenCalled();
			expect(warnMock).toHaveBeenCalledWith(expect.stringContaining("Non-interactive postinstall"));
		} finally {
			process.stdin.isTTY = prevStdinTTY;
			process.stdout.isTTY = prevStdoutTTY;
		}
	});

	it("skips installing when user answers no", async () => {
		vi.resetAllMocks();

		// Mock readline createInterface.question to return 'n'
		const createInterfaceMock = vi.mocked(createInterface);
		// Cast via unknown to avoid requiring full Interface surface in test
		const fakeRl = {
			question: async (): Promise<string> => {
				await Promise.resolve();
				return "n";
			},
			close: (): void => undefined,
		};
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion
		createInterfaceMock.mockImplementation(() => fakeRl as unknown as Interface);

		// Make runtime appear interactive
		const prevStdinTTY = process.stdin.isTTY;
		const prevStdoutTTY = process.stdout.isTTY;
		try {
			process.stdin.isTTY = true;
			process.stdout.isTTY = true;

			await maybePrompt(false, "/fake/exe/path");

			// spawnSync should not be called when user answers no
			const spawnMock = vi.mocked(spawnSync);
			const warnMock = vi.mocked(warn);
			expect(spawnMock).not.toHaveBeenCalled();
			expect(warnMock).toHaveBeenCalledWith(expect.stringContaining("Skipping install-deps"));
		} finally {
			process.stdin.isTTY = prevStdinTTY;
			process.stdout.isTTY = prevStdoutTTY;
		}
	});

	it("attempts install when user answers yes and logs an error if install fails", async () => {
		vi.resetAllMocks();

		const createInterfaceMock = vi.mocked(createInterface);
		// Cast via unknown to avoid requiring full Interface surface in test
		const fakeRlYes = {
			question: async (): Promise<string> => {
				await Promise.resolve();
				return "yes";
			},
			close: (): void => undefined,
		};
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion
		createInterfaceMock.mockImplementation(() => fakeRlYes as unknown as Interface);

		// simulate non-zero exit to trigger sError
		const spawnMock = vi.mocked(spawnSync);
		// Allow simplified mock return shape for spawnSync in tests
		// @ts-expect-error - simplified test stub
		spawnMock.mockReturnValue({ status: NON_ZERO });

		const prevStdinTTY = process.stdin.isTTY;
		const prevStdoutTTY = process.stdout.isTTY;
		try {
			process.stdin.isTTY = true;
			process.stdout.isTTY = true;

			await maybePrompt(false, "/fake/exe/path");

			const errorMock = vi.mocked(error);
			expect(spawnMock).toHaveBeenCalledWith(
				"sudo",
				["npx", "playwright", "install-deps"],
				expect.objectContaining({ shell: true }),
			);
			expect(errorMock).toHaveBeenCalledWith(
				expect.stringContaining("Failed to install system deps"),
			);
		} finally {
			process.stdin.isTTY = prevStdinTTY;
			process.stdout.isTTY = prevStdoutTTY;
		}
	});

	it("does not crash and warns when prompt throws", async () => {
		vi.resetAllMocks();

		const createInterfaceMock = vi.mocked(createInterface);
		// Cast via unknown to avoid requiring full Interface surface in test
		const fakeRlThrow = {
			question: async (): Promise<string> => {
				await Promise.resolve();
				throw new Error("prompt fail");
			},
			close: (): void => undefined,
		};
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion
		createInterfaceMock.mockImplementation(() => fakeRlThrow as unknown as Interface);

		const prevStdinTTY = process.stdin.isTTY;
		const prevStdoutTTY = process.stdout.isTTY;
		try {
			process.stdin.isTTY = true;
			process.stdout.isTTY = true;

			await maybePrompt(false, "/fake/exe/path");

			const warnMock = vi.mocked(warn);
			expect(warnMock).toHaveBeenCalledWith(
				expect.stringContaining("Could not prompt for install-deps"),
			);
		} finally {
			process.stdin.isTTY = prevStdinTTY;
			process.stdout.isTTY = prevStdoutTTY;
		}
	});
});
