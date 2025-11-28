#!/usr/bin/env bun
/**
 * Programmatic migration runner using Node.js
 * Provides detailed logging and error handling
 */
import { execSync } from "child_process";
import { statSync } from "fs";

import { warn as sWarn, error as sError } from "../utils/scriptLogger";
import { getMigrationFiles } from "./helpers/getMigrationFiles";
import { loadEnvVars } from "./helpers/loadEnvVars";
import { runMigration } from "./helpers/runMigration";

/**
 * Main entrypoint for the programmatic migration runner.
 *
 * - Loads environment variables
 * - Discovers migrations in `supabase/migrations`
 * - Runs each migration in order
 * - Attempts to regenerate TypeScript schemas via npm script
 *
 * @returns Resolves when all migrations and post-migration tasks complete.
 */
function main(): void {
	const ZERO = 0;
	const EXIT_NON_ZERO = 1;

	sWarn("🚀 Starting programmatic migration runner...");

	try {
		// Load environment variables
		const env = loadEnvVars();

		// Get migration files
		const migrationDir = "supabase/migrations";
		const migrations = getMigrationFiles(migrationDir);

		if (migrations.length === ZERO) {
			sWarn("ℹ️  No migration files found");
			return;
		}

		sWarn("📋 Found migrations:");
		migrations.forEach((migration) => {
			const stats = statSync(migration.path);
			sWarn(`  - ${migration.filename} (${stats.size} bytes)`);
		});
		sWarn("");

		// Run each migration
		for (const migration of migrations) {
			runMigration(migration, env);
		}

		sWarn("");
		sWarn("🎉 All migrations completed successfully!");

		// Regenerate schemas
		sWarn("🔄 Regenerating TypeScript schemas...");
		try {
			// This is a safe npm script execution for schema generation
			execSync("npm run supabase:generate", { stdio: "inherit" });
			sWarn("✅ Schema generation completed");
		} catch (error) {
			sWarn("⚠️  Schema generation failed:", error);
		}

		sWarn("✅ Migration process complete!");
	} catch (error) {
		sError("❌ Migration process failed:", error);
		process.exit(EXIT_NON_ZERO);
	}
}

// Run if this file is executed directly
if (import.meta.main) {
	main();
}
