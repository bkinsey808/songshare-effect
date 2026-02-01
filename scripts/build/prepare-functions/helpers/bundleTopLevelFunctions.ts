import { readdir, unlink } from "node:fs/promises";
import path from "node:path";

import { warn as sWarn } from "@/scripts/utils/scriptLogger";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

export default async function bundleTopLevelFunctions(outDir: string): Promise<void> {
	try {
		// dynamic import so script still works if esbuild isn't available
		const { build } = await import("esbuild");
		const entries = await readdir(outDir, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.isFile() && entry.name.endsWith(".ts")) {
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
			} else {
				// skip non-TypeScript files
			 }
		}
	} catch (error) {
		const message: string | undefined = extractErrorMessage(error, "Unknown error");
		sWarn("Warning: could not bundle functions with esbuild:", message);
	}
}
