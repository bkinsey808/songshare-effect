import { readdir, unlink } from "node:fs/promises";
import * as path from "node:path";

import { warn as sWarn } from "../../../utils/scriptLogger";

export async function bundleTopLevelFunctions(outDir: string): Promise<void> {
	try {
		// dynamic import so script still works if esbuild isn't available
		const { build } = await import("esbuild");
		const entries = await readdir(outDir, { withFileTypes: true });
		for (const entry of entries) {
			if (!entry.isFile()) {
				// skip non-files
			} else if (!entry.name.endsWith(".ts")) {
				// skip non-TypeScript files
			} else {
				const entryPath = path.join(outDir, entry.name);
				const out = path.join(outDir, entry.name.replace(/\.ts$/, ".js"));
				sWarn("Bundling function ->", entryPath, "->", out);
				// build runs sequentially for simplicity — awaiting inside a loop is intentional
				// oxlint-disable-next-line no-await-in-loop
				await build({
					entryPoints: [entryPath],
					bundle: true,
					platform: "browser",
					format: "esm",
					target: ["es2020"],
					outfile: out,
					minify: true,
				});

				// remove the original .ts file so Pages deploy uses the bundled .js
				try {
					// oxlint-disable-next-line no-await-in-loop
					await unlink(entryPath);
					sWarn("Removed source function file ->", entryPath);
				} catch {
					// non-fatal
				}
			}
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		sWarn("Warning: could not bundle functions with esbuild:", message);
	}
}
