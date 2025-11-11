#!/usr/bin/env bun
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
/* eslint-disable sonarjs/os-command-injection */
/* eslint-disable sonarjs/command-line-injection */
/**
 * Programmatic migration runner using Node.js
 * Provides detailed logging and error handling
 */
import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

type MigrationFile = {
	path: string;
	filename: string;
	timestamp: string;
};

function loadEnvVars(): Record<string, string | undefined> {
	const env: Record<string, string | undefined> = {};

	try {
		const envFile = ".env";
		if (existsSync(envFile)) {
			const content = readFileSync(envFile, "utf-8");
			content.split("\n").forEach((line: string) => {
				const trimmed = line.trim();
				if (trimmed && !trimmed.startsWith("#")) {
					const [key, ...valueParts] = trimmed.split("=");
					if (key && valueParts.length > 0) {
						env[key.trim()] = valueParts.join("=").trim();
					}
				}
			});
		}
	} catch (error) {
		console.error("❌ Error loading .env file:", error);
		process.exit(1);
	}

	return env;
}

function getMigrationFiles(migrationDir: string): MigrationFile[] {
	if (!existsSync(migrationDir)) {
		throw new Error(`Migration directory not found: ${migrationDir}`);
	}

	const files = readdirSync(migrationDir)
		.filter((file) => file.endsWith(".sql"))
		.map((filename) => {
			const path = join(migrationDir, filename);
			// Extract timestamp from filename (format: YYYYMMDDHHMMSS_name.sql)
			const timestampRegex = /^(\d{14})_/;
			const timestampMatch = timestampRegex.exec(filename);
			const timestamp = timestampMatch ? timestampMatch[1] : "00000000000000";

			return {
				path,
				filename,
				timestamp,
			} as MigrationFile;
		})
		.sort((fileA, fileB) => fileA.timestamp.localeCompare(fileB.timestamp));

	return files;
}

async function runMigration(
	migration: MigrationFile,
	env: Record<string, string | undefined>,
): Promise<void> {
	console.log(`📄 Running migration: ${migration.filename}`);

	const { PGHOST, PGUSER, PGPASSWORD, PGDATABASE } = env;

	if (!PGHOST || !PGUSER || !PGPASSWORD || !PGDATABASE) {
		throw new Error(
			"Missing required PostgreSQL environment variables: PGHOST, PGUSER, PGPASSWORD, PGDATABASE",
		);
	}

	try {
		// cspell:disable-next-line
		const command = `psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" -f "${migration.path}"`;

		// This is a controlled script execution - command is constructed from validated env vars
		// and migration file path. The script is only run by developers for database migrations.
		execSync(command, {
			stdio: "inherit",
			env: {
				...process.env,
				PGPASSWORD,
			},
		});

		console.log(`✅ Migration successful: ${migration.filename}`);
	} catch (error) {
		console.error(`❌ Migration failed: ${migration.filename}`);
		console.error(error);
		throw error;
	}
}

async function main(): Promise<void> {
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
			await runMigration(migration, env);
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
	void main();
}
