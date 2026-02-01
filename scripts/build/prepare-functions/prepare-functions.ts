#!/usr/bin/env bun
import { readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { warn as sWarn } from "@/scripts/utils/scriptLogger";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import bundleTopLevelFunctions from "./helpers/bundleTopLevelFunctions";
import copyAndRewriteShared from "./helpers/copyAndRewriteShared";
import ensureDir from "./helpers/ensureDir";
import listFilesRecursively from "./helpers/listFilesRecursively";

// Prepares the Cloudflare functions bundle by copying shared code into dist and fixing import paths.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const distFunctionsDir = path.join(repoRoot, "dist", "functions");
const srcFunctionsDir = path.join(repoRoot, "functions");
const sharedSrcDir = path.join(repoRoot, "shared", "src");

/**
 * Copies shared code into the functions dist directory and rewrites imports for deployment.
 */

// helper functions are provided by modules in ./helpers
async function prepare(): Promise<void> {
	await ensureDir(distFunctionsDir);

	const destShared = path.join(distFunctionsDir, "shared");
	await copyAndRewriteShared(sharedSrcDir, destShared);

	// The shared language files are now the single source of truth. copyDir
	// already copied `shared/src` into `dist/functions/shared` so we don't
	// create separate shims here. This keeps the language definitions in one
	// place and avoids duplication.

	// Remove any copied shared files that import external runtime packages
	// (not available to Pages Functions) to avoid runtime import errors.
	try {
		const allFiles = await listFilesRecursively(destShared);
		const toRemove: string[] = [];
		// Build a small whitelist of external packages that are safe to include in
		// Pages Functions. Historically we pruned all files that used external
		// packages (non-relative imports) to avoid pulling in unexpected runtime
		// dependencies. We'll allow a small, explicit list (eg. 'effect') so
		// effect-based helpers can remain in the functions bundle when desired.
		const allowedExternalPackages = new Set(["effect"]);

		for (const filePath of allFiles) {
			// Intentionally await in this loop to read files sequentially and avoid
			// opening too many file handles at once during the preparation step.
			// oxlint-disable-next-line no-await-in-loop
			const contents = await readFile(filePath, "utf8");

			// Find all non-relative imports / requires and capture the package
			// name (the first path segment) so we can decide whether it's
			// allowed. Example matches: "effect", "effect/Either", "vitest".
			const externalImportRegex =
				/(?:from|require\()\s*["'](?!\.\/?|\.\.\/)([^"'/]+)(?:["'/])/gi;
			let shouldPrune = false;

			for (const matchItem of contents.matchAll(externalImportRegex)) {
				const [, rawPackageName] = matchItem;
				const packageName = (rawPackageName ?? "").toString();
				// Convert the `Set` to a temporary array so we can use
				// `Array.prototype.some`. `Set` doesn't implement `.some()`, and
				// using the spread here is a concise way to perform the
				// equality / `startsWith` checks. Alternatives would be a
				// one-time precomputed array outside the loop or an explicit
				// `for...of` iteration to avoid the small allocation.
				const allowed = [...allowedExternalPackages].some(
					(pkg) => packageName === pkg || packageName.startsWith(`${pkg}/`),
				);
				if (!allowed) {
					shouldPrune = true;
					break;
				}
			}

			if (shouldPrune) {
				toRemove.push(filePath);
			}
		}

		for (const filePath of toRemove) {
			// Remove files sequentially so we don't trigger too many concurrent
			// filesystem operations at once.
			// oxlint-disable-next-line no-await-in-loop
			await unlink(filePath);
			sWarn(
				"Removed unsupported shared file from functions bundle ->",
				filePath,
			);
		}
	} catch (error) {
		const message = extractErrorMessage(error, "Unknown error");
		sWarn("Warning: could not prune shared files:", message);
	}

	const middlewareSrc = path.join(srcFunctionsDir, "_middleware.ts");
	const middlewareDest = path.join(distFunctionsDir, "_middleware.ts");
	try {
		const content = await readFile(middlewareSrc, "utf8");
		const rewritten = content.replaceAll("@/shared/", "./shared/");
		await writeFile(middlewareDest, rewritten, "utf8");
		sWarn("Prepared middleware ->", middlewareDest);
	} catch (error) {
		const message = extractErrorMessage(error, "Unknown error");
		sWarn("Warning: could not prepare middleware:", message);
	}

	// Bundle top-level functions via helper so prepare() keeps simple
	await bundleTopLevelFunctions(distFunctionsDir);
}

await prepare();
