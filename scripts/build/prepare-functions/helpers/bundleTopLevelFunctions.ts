 
import { readdir, unlink } from "node:fs/promises";
import * as path from "node:path";

export async function bundleTopLevelFunctions(outDir: string): Promise<void> {
    try {
        // dynamic import so script still works if esbuild isn't available
        const { build } = await import("esbuild");
        const entries = await readdir(outDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isFile()) {
                continue;
            }
            if (!entry.name.endsWith(".ts")) {
                continue;
            }

            const entryPath = path.join(outDir, entry.name);
            const out = path.join(outDir, entry.name.replace(/\.ts$/, ".js"));
            console.log("Bundling function ->", entryPath, "->", out);
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
                await unlink(entryPath);
                console.log("Removed source function file ->", entryPath);
            } catch {
                // non-fatal
            }
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn("Warning: could not bundle functions with esbuild:", message);
    }
}
