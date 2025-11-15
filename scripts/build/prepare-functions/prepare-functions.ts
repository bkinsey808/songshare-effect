#!/usr/bin/env bun
/* eslint-disable no-console */
import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { copyDir } from "./helpers/copyDir";
import { ensureDir } from "./helpers/ensureDir";
import { rewriteSharedImports } from "./helpers/rewriteSharedImports";

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
async function prepare(): Promise<void> {
	await ensureDir(distFunctionsDir);

	const destShared = path.join(distFunctionsDir, "shared");
	try {
		await copyDir(sharedSrcDir, destShared);
		console.log("Copied shared/src ->", destShared);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn("Warning: could not copy shared/src:", message);
	}

	try {
		await rewriteSharedImports(destShared);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn(
			"Warning: could not rewrite imports in copied shared files:",
			message,
		);
	}

	const middlewareSrc = path.join(srcFunctionsDir, "_middleware.ts");
	const middlewareDest = path.join(distFunctionsDir, "_middleware.ts");
	try {
		const content = await readFile(middlewareSrc, "utf8");
		const rewritten = content.replace(/@\/shared\//g, "./shared/");
		await writeFile(middlewareDest, rewritten, "utf8");
		console.log("Prepared middleware ->", middlewareDest);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn("Warning: could not prepare middleware:", message);
	}
}

await prepare();
