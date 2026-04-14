import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import bootstrap from "./bootstrapLocalIndex";
import ensureConfigFile from "./ensureConfigFile";
import runProcess from "./runProcess";
import writeFilteredOutput from "./writeFilteredOutput";

const EXIT_CODE = 9;

vi.mock("./bootstrapLocalIndex");
vi.mock("./ensureConfigFile");
vi.mock("./runProcess");
vi.mock("./writeFilteredOutput");
const ONE = 1;

describe("runQmd", () => {
	it("bootstraps local index + config, runs qmd, and writes filtered output", async () => {
		vi.resetAllMocks();
		const repoRoot = mkdtempSync(join(tmpdir(), "songshare-"));

		vi.mocked(bootstrap).mockImplementation((_arg: unknown) => Effect.succeed(undefined));
		vi.mocked(ensureConfigFile).mockImplementation((_dir: string, _repo: string) => undefined);
		vi.mocked(runProcess).mockImplementation((_args: readonly string[], _opts: unknown) =>
			Effect.succeed({ exitCode: EXIT_CODE, output: "OUT" }),
		);
		vi.mocked(writeFilteredOutput).mockImplementation((_out: string) => undefined);

		const originalIndex = process.env["INDEX_PATH"];
		const originalConfig = process.env["QMD_CONFIG_DIR"];

		try {
			delete process.env["INDEX_PATH"];
			delete process.env["QMD_CONFIG_DIR"];

			const runQmdMod = await import("./runQmd");
			const res = await Effect.runPromise(runQmdMod.default(["help"], { repoRoot }));

			expect(res).toBe(EXIT_CODE);
			expect(vi.mocked(runProcess)).toHaveBeenCalledTimes(ONE);
			expect(vi.mocked(writeFilteredOutput)).toHaveBeenCalledTimes(ONE);
			expect(vi.mocked(ensureConfigFile)).toHaveBeenCalledTimes(ONE);
			expect(vi.mocked(bootstrap)).toHaveBeenCalledTimes(ONE);

			expect(vi.mocked(bootstrap)).toHaveBeenCalledWith(
				expect.objectContaining({ qmdBin: resolve(repoRoot, "node_modules/.bin/qmd") }),
			);
		} finally {
			process.env["INDEX_PATH"] = originalIndex;
			process.env["QMD_CONFIG_DIR"] = originalConfig;

			vi.restoreAllMocks();
		}
	});

	it("does not bootstrap or write config when env vars are present", async () => {
		vi.resetAllMocks();
		const repoRoot = mkdtempSync(join(tmpdir(), "songshare-"));

		vi.mocked(bootstrap).mockImplementation((_arg: unknown) => Effect.succeed(undefined));
		vi.mocked(ensureConfigFile).mockImplementation((_dir: string, _repo: string) => undefined);
		vi.mocked(runProcess).mockImplementation((_args: readonly string[], _opts: unknown) =>
			Effect.succeed({ exitCode: EXIT_CODE, output: "OUT" }),
		);
		vi.mocked(writeFilteredOutput).mockImplementation((_out: string) => undefined);

		const originalIndex = process.env["INDEX_PATH"];
		const originalConfig = process.env["QMD_CONFIG_DIR"];

		try {
			process.env["INDEX_PATH"] = join(repoRoot, "index.sqlite");
			process.env["QMD_CONFIG_DIR"] = join(repoRoot, "config");

			const runQmdMod = await import("./runQmd");
			const res = await Effect.runPromise(runQmdMod.default([], { repoRoot }));

			expect(res).toBe(EXIT_CODE);
			expect(vi.mocked(runProcess)).toHaveBeenCalledTimes(ONE);
			expect(vi.mocked(writeFilteredOutput)).toHaveBeenCalledTimes(ONE);
			expect(vi.mocked(ensureConfigFile)).not.toHaveBeenCalled();
			expect(vi.mocked(bootstrap)).not.toHaveBeenCalled();
		} finally {
			process.env["INDEX_PATH"] = originalIndex;
			process.env["QMD_CONFIG_DIR"] = originalConfig;

			vi.restoreAllMocks();
		}
	});
});
