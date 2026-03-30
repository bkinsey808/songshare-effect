import { log as sLog } from "@/scripts/utils/scriptLogger";

import { type TableDefinition } from "./generate-effect-schemas-types";

/**
 * Logs a compact summary of the generated schema tables.
 *
 * @param tables - Generated table metadata to summarize in script output.
 * @returns void
 */
export default function logGeneratedTables(tables: readonly TableDefinition[]): void {
	sLog(`📊 Generated schemas for ${tables.length} tables:`);
	for (const table of tables) {
		sLog(`  - ${table.name} (${table.columns.length} columns)`);
	}
}
