import { log as sLog } from "@/scripts/utils/scriptLogger";

import { type TableDefinition } from "./generate-effect-schemas-types";

export default function logGeneratedTables(
	tables: readonly TableDefinition[],
): void {
	sLog(`📊 Generated schemas for ${tables.length} tables:`);
	for (const table of tables) {
		sLog(`  - ${table.name} (${table.columns.length} columns)`);
	}
}
