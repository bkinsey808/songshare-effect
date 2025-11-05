#!/usr/bin/env node
/* eslint-disable no-undef */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");
const distFunctionsDir = path.join(root, "dist", "functions");
const srcFunctionsDir = path.join(root, "functions");
const sharedSrcDir = path.join(root, "shared", "src");

async function ensureDir(dir) {
	await fs.mkdir(dir, { recursive: true });
}

async function copyFile(src, dest) {
	await ensureDir(path.dirname(dest));
	await fs.copyFile(src, dest);
}

async function copyDir(srcDir, destDir) {
	await ensureDir(destDir);
	const entries = await fs.readdir(srcDir, { withFileTypes: true });
	for (const entry of entries) {
		const srcPath = path.join(srcDir, entry.name);
		const destPath = path.join(destDir, entry.name);
		if (entry.isDirectory()) {
			await copyDir(srcPath, destPath);
		} else if (entry.isFile()) {
			await copyFile(srcPath, destPath);
		}
	}
}

// Walk files under a directory and apply an async callback(filePath)
async function walkFiles(dir, cb) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const p = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			await walkFiles(p, cb);
		} else if (entry.isFile()) {
			await cb(p);
		}
	}
}

async function prepare() {
	// Ensure dist/functions exists
	await ensureDir(distFunctionsDir);

	// Copy shared source into dist/functions/shared so functions can import relatively
	const destShared = path.join(distFunctionsDir, "shared");
	try {
		await copyDir(sharedSrcDir, destShared);
		console.log("Copied shared/src ->", destShared);
	} catch (err) {
		console.warn("Warning: could not copy shared/src:", err.message);
	}

	// Rewrite any "@/shared/..." imports inside the copied shared files to proper relative paths
	try {
		let replacements = 0;
		await walkFiles(destShared, async (filePath) => {
			let content = await fs.readFile(filePath, "utf8");
			// regex to find imports using the '@/shared/...' alias
			const re = /@\/shared\/([\w@/. -]+)/g;
			let match;
			let newContent = content;
			while ((match = re.exec(content)) !== null) {
				const targetSubpath = match[1]; // e.g. "language/supportedLanguages"
				const fileDir = path.dirname(filePath);
				const targetAbs = path.join(destShared, targetSubpath);
				// compute relative path from fileDir to targetAbs
				let rel = path.relative(fileDir, targetAbs);
				// normalize to posix-style separators for imports
				rel = rel.split(path.sep).join("/");
				if (!rel.startsWith(".")) rel = "./" + rel;
				// Remove possible file extensions in imports (ts files should be fine)
				// Replace the exact matched alias with the computed relative
				newContent = newContent.replace(
					new RegExp(match[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
					rel,
				);
				replacements++;
			}
			if (replacements > 0 && newContent !== content) {
				await fs.writeFile(filePath, newContent, "utf8");
			}
		});
		console.log(
			`Rewrote ${replacements} '@/shared/*' imports inside ${destShared}`,
		);
	} catch (err) {
		console.warn(
			"Warning: could not rewrite imports in copied shared files:",
			err.message,
		);
	}

	// Copy middleware and rewrite @/shared imports to ./shared
	const middlewareSrc = path.join(srcFunctionsDir, "_middleware.ts");
	const middlewareDest = path.join(distFunctionsDir, "_middleware.ts");
	try {
		const content = await fs.readFile(middlewareSrc, "utf8");
		const rewritten = content.replace(/@\/shared\//g, "./shared/");
		await fs.writeFile(middlewareDest, rewritten, "utf8");
		console.log("Prepared middleware ->", middlewareDest);
	} catch (err) {
		console.warn("Warning: could not prepare middleware:", err.message);
	}
}

prepare().catch((err) => {
	console.error(err);
	process.exit(1);
});
