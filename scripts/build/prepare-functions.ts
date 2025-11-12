#!/usr/bin/env bun
/* eslint-disable no-console */
import { mkdir, readFile, readdir, writeFile, copyFile } from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

type FileCallback = (filePath: string) => Promise<void>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const distFunctionsDir = path.join(repoRoot, "dist", "functions");
const srcFunctionsDir = path.join(repoRoot, "functions");
const sharedSrcDir = path.join(repoRoot, "shared", "src");

async function ensureDir(dir: string): Promise<void> {
	await mkdir(dir, { recursive: true });
}

async function copyFileSafe(src: string, dest: string): Promise<void> {
	await ensureDir(path.dirname(dest));
	await copyFile(src, dest);
}

async function copyDir(srcDir: string, destDir: string): Promise<void> {
	await ensureDir(destDir);
	const entries = await readdir(srcDir, { withFileTypes: true });
	for (const entry of entries) {
		const srcPath = path.join(srcDir, entry.name);
		const destPath = path.join(destDir, entry.name);
		if (entry.isDirectory()) {
			await copyDir(srcPath, destPath);
		} else if (entry.isFile()) {
			await copyFileSafe(srcPath, destPath);
		}
	}
}

async function walkFiles(dir: string, cb: FileCallback): Promise<void> {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const entryPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			await walkFiles(entryPath, cb);
		} else if (entry.isFile()) {
			await cb(entryPath);
		}
	}
}

async function rewriteSharedImports(destShared: string): Promise<void> {
	let replacements = 0;
	await walkFiles(destShared, async (filePath) => {
		const content = await readFile(filePath, "utf8");
		const importPattern = /@\/shared\/([\w@/. -]+)/g;
		let nextContent = content;
		let match: RegExpExecArray | null = importPattern.exec(content);
		while (match !== null) {
			const targetSubpath = match[1];
			if (targetSubpath === undefined) {
				match = importPattern.exec(content);
				continue;
			}
			const fileDir = path.dirname(filePath);
			const targetAbs = path.join(destShared, targetSubpath);
			let relPath = path.relative(fileDir, targetAbs).split(path.sep).join("/");
			if (!relPath.startsWith(".")) {
				relPath = `./${relPath}`;
			}

			nextContent = nextContent.replaceAll(match[0], relPath);
			replacements++;
			match = importPattern.exec(content);
		}

		if (replacements > 0 && nextContent !== content) {
			await writeFile(filePath, nextContent, "utf8");
		}
	});

	console.log(`Rewrote ${replacements} '@/shared/*' imports inside ${destShared}`);
}

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
