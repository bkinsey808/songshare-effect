import { existsSync, readdirSync } from "fs";
import { join } from "path";

import type { MigrationFile } from "./types";

/**
 * Read and return migration files from the specified directory.
 *
 * Looks for files ending with `.sql`, extracts a timestamp from filenames
 * using the pattern `YYYYMMDDHHMMSS_name.sql`, and returns an array of
 * migration metadata objects sorted by timestamp.
 *
 * @param migrationDir - Path to the migrations directory.
 * @returns Array of migration metadata objects sorted by timestamp.
 * @throws If the migration directory does not exist.
 */
export function getMigrationFiles(migrationDir: string): MigrationFile[] {
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
