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
function main(): void {
	// oxlint-disable-next-line no-console
	console.log("🔄 Finding TypeScript and React files...");

	const patterns = ["*.ts", "*.tsx"];
	const allFiles: string[] = [];

	for (const pattern of patterns) {
		const files = findAllTsFiles(pattern);
		allFiles.push(...files);
	}

	// oxlint-disable-next-line no-console
	console.log(`📁 Found ${allFiles.length} files to process`);

	const UPDATED_COUNT_INCREMENT = 1;
	const EXIT_FAILURE = 1;

	let updatedCount = 0;

	for (const file of allFiles) {
		if (updateFileImports(file)) {
			updatedCount += UPDATED_COUNT_INCREMENT;
		}
	}

	// oxlint-disable-next-line no-console
	console.log(`🎉 Updated ${updatedCount} files with new import paths`);

	// Run build to test
	// oxlint-disable-next-line no-console
	console.log("🧪 Testing build with updated imports...");
	try {
		execSync("npm run build", { stdio: "inherit", cwd: process.cwd() });
		// oxlint-disable-next-line no-console
		console.log("✅ Build successful! All imports converted correctly.");
	} catch {
		console.error("❌ Build failed. Please check the imports manually.");
		process.exit(EXIT_FAILURE);
	}
}

if (import.meta.main) {
	main();
}
