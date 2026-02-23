#!/usr/bin/env bun
/* oxlint-disable sonarjs/no-os-command-from-path, sonarjs/no-ignored-exceptions */
/**
 * Script to convert relative imports to path aliases
 * - @/shared -> shared/src
 * - @/react -> react/src
 * - @/api -> api/src
 */
import { execSync } from "node:child_process";

import { error as sError, log as sLog } from "@/scripts/utils/scriptLogger";

import { findAllTsFiles } from "./helpers/findAllTsFiles";
import updateFileImports from "./helpers/updateFileImports";

/**
 * Orchestrates the import rewrite process and triggers a validation build.
 * @returns Resolves when the script completes or exits on failure.
 */
function main(): void {
	sLog("🔄 Finding TypeScript and React files...");

	const patterns = ["*.ts", "*.tsx"];
	const allFiles: string[] = [];

	for (const pattern of patterns) {
		const files = findAllTsFiles(pattern);
		allFiles.push(...files);
	}

	sLog(`📁 Found ${allFiles.length} files to process`);

	const UPDATED_COUNT_INCREMENT = 1;
	const EXIT_FAILURE = 1;

	let updatedCount = 0;

	for (const file of allFiles) {
		if (updateFileImports(file)) {
			updatedCount += UPDATED_COUNT_INCREMENT;
		}
	}

	sLog(`🎉 Updated ${updatedCount} files with new import paths`);

	// Run build to test
	sLog("🧪 Testing build with updated imports...");
	try {
		execSync("npm run build", { stdio: "inherit", cwd: process.cwd() });
		sLog("✅ Build successful! All imports converted correctly.");
	} catch {
		sError("❌ Build failed. Please check the imports manually.");
		process.exit(EXIT_FAILURE);
	}
}

if (import.meta.main) {
	main();
}
