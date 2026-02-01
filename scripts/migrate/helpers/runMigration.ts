import { execSync } from "node:child_process";

import { error as sError, warn as sWarn } from "@/scripts/utils/scriptLogger";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import isEmpty from "@/shared/type-guards/isEmpty";

import type { MigrationFile } from "./types";

/**
 * Get a string representation of an error.
 */

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
export default function runMigration(
	migration: Readonly<MigrationFile>,
	env: Readonly<Record<string, string | undefined>>,
): void {
	sWarn(`📄 Running migration: ${migration.filename}`);

	const { PGHOST, PGUSER, PGPASSWORD, PGDATABASE } = env;

	if (isEmpty(PGHOST) || isEmpty(PGUSER) || isEmpty(PGPASSWORD) || isEmpty(PGDATABASE)) {
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

		sWarn(`✅ Migration successful: ${migration.filename}`);
	} catch (error: unknown) {
		sError(`❌ Migration failed: ${migration.filename}`);
		sError(extractErrorMessage(error, "Unknown error"));
		throw error;
	}
}

// This helper intentionally uses a default export. Callers should import
// the default export: `import runMigration from "./helpers/runMigration"`.
