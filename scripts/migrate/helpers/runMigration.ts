import { execSync } from "child_process";

import type { MigrationFile } from "./types";

/**
 * Get a string representation of an error.
 */
function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

/**
 * Execute a single SQL migration using the `psql` CLI.
 *
 * Validates that required Postgres environment variables are present and
 * runs the migration file. Output is inherited so the psql output appears
 * in the current process's stdout/stderr.
 *
 * @param migration - Migration file metadata (path, filename, timestamp).
 * @param env - Environment variables mapping used to construct the command.
 * @returns Resolves when the migration completes successfully.
 * @throws If required environment variables are missing or the command fails.
 */
export function runMigration(
	migration: Readonly<MigrationFile>,
	env: Readonly<Record<string, string | undefined>>,
): void {
	console.warn(`📄 Running migration: ${migration.filename}`);

	const { PGHOST, PGUSER, PGPASSWORD, PGDATABASE } = env;

	function isEmpty(value: string | undefined): boolean {
		return value === undefined || value.trim() === "";
	}

	if (
		isEmpty(PGHOST) ||
		isEmpty(PGUSER) ||
		isEmpty(PGPASSWORD) ||
		isEmpty(PGDATABASE)
	) {
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

		console.warn(`✅ Migration successful: ${migration.filename}`);
	} catch (error: unknown) {
		console.error(`❌ Migration failed: ${migration.filename}`);
		console.error(getErrorMessage(error));
		throw error;
	}
}
