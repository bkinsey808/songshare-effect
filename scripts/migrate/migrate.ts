#!/usr/bin/env bun
/**
 * Programmatic migration runner using Node.js
 * Provides detailed logging and error handling
 */
import { execSync } from "child_process";
import { statSync } from "fs";

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
	console.log("🚀 Starting programmatic migration runner...");

	try {
		// Load environment variables
		const env = loadEnvVars();

		// Get migration files
		const migrationDir = "supabase/migrations";
		const migrations = getMigrationFiles(migrationDir);

		if (migrations.length === 0) {
			console.log("ℹ️  No migration files found");
			return;
		}

		console.log("📋 Found migrations:");
		migrations.forEach((migration) => {
			const stats = statSync(migration.path);
			console.log(`  - ${migration.filename} (${stats.size} bytes)`);
		});
		console.log("");

		// Run each migration
		for (const migration of migrations) {
			runMigration(migration, env);
		}

		console.log("");
		console.log("🎉 All migrations completed successfully!");

		// Regenerate schemas
		console.log("🔄 Regenerating TypeScript schemas...");
		try {
			// This is a safe npm script execution for schema generation
			execSync("npm run supabase:generate", { stdio: "inherit" });
			console.log("✅ Schema generation completed");
		} catch (error) {
			console.warn("⚠️  Schema generation failed:", error);
		}

		console.log("✅ Migration process complete!");
	} catch (error) {
		console.error("❌ Migration process failed:", error);
		process.exit(1);
	}
}

// Run if this file is executed directly
if (import.meta.main) {
	main();
}
