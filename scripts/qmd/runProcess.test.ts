import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import runProcess from "./runProcess";

const QMD = "/usr/bin/qmd";
const EXIT_CODE = 42;

describe("runProcess", () => {
	it("returns combined stdout and stderr and exit code", async () => {
		const originalBun = Reflect.get(globalThis, "Bun");

		try {
			vi.stubGlobal("Bun", {
				spawn: (_opts: unknown): { stdout: string; stderr: string; exited: Promise<number> } => ({
					stdout: "STDOUT-",
					stderr: "-STDERR",
					exited: (async (): Promise<number> => {
						await Promise.resolve();
						return EXIT_CODE;
					})(),
				}),
			});

			const res = await Effect.runPromise(runProcess([QMD, "arg"], { suppressOutput: false }));

			expect(res).toStrictEqual({ exitCode: EXIT_CODE, output: "STDOUT--STDERR" });
		} finally {
			Reflect.set(globalThis, "Bun", originalBun);
		}
	});

	it("respects suppressOutput option and returns empty output", async () => {
		const originalBun = Reflect.get(globalThis, "Bun");

		try {
			vi.stubGlobal("Bun", {
				spawn: (_opts: unknown): { stdout: string; stderr: string; exited: Promise<number> } => ({
					stdout: "X",
					stderr: "Y",
					exited: (async (): Promise<number> => {
						await Promise.resolve();
						return EXIT_CODE;
					})(),
				}),
			});

			const res = await Effect.runPromise(runProcess([QMD], { suppressOutput: true }));

			expect(res.exitCode).toBe(EXIT_CODE);
			expect(res.output).toBe("");
		} finally {
			Reflect.set(globalThis, "Bun", originalBun);
		}
	});
});
