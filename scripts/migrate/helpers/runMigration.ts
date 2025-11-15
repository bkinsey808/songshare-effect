import { execSync } from "child_process";
import type { MigrationFile } from "./types";

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
export async function runMigration(
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
    // eslint-disable-next-line sonarjs/os-command -- migration command uses validated env vars and audited file paths
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
