#!/usr/bin/env bun
/* eslint-disable sonarjs/no-os-command-from-path, sonarjs/no-ignored-exceptions */
/**
 * Script to convert relative imports to path aliases
 * - @/shared -> shared/src
 * - @/react -> react/src
 * - @/api -> api/src
 */
import { execSync } from "child_process";

import { findAllTsFiles } from "./helpers/findAllTsFiles";
import { updateFileImports } from "./helpers/updateFileImports";

/**
 * Orchestrates the import rewrite process and triggers a validation build.
 * @returns Resolves when the script completes or exits on failure.
 */
async function main(): Promise<void> {
	console.log("🔄 Finding TypeScript and React files...");

	const patterns = ["*.ts", "*.tsx"];
	const allFiles: string[] = [];

	for (const pattern of patterns) {
		const files = findAllTsFiles(pattern);
		allFiles.push(...files);
	}

	console.log(`📁 Found ${allFiles.length} files to process`);

	let updatedCount = 0;

	for (const file of allFiles) {
		if (updateFileImports(file)) {
			updatedCount++;
		}
	}

	console.log(`🎉 Updated ${updatedCount} files with new import paths`);

	// Run build to test
	console.log("🧪 Testing build with updated imports...");
	try {
		execSync("npm run build", { stdio: "inherit", cwd: process.cwd() });
		console.log("✅ Build successful! All imports converted correctly.");
	} catch {
		console.error("❌ Build failed. Please check the imports manually.");
		process.exit(1);
	}
}

if (import.meta.main) {
	void main();
}
