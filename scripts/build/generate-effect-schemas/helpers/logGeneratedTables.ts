import { log as sLog } from "../../../utils/scriptLogger";
import { type TableDefinition } from "./generate-effect-schemas-types";

export function logGeneratedTables(
	tables: ReadonlyArray<TableDefinition>,
): void {
	sLog(`📊 Generated schemas for ${tables.length} tables:`);
	tables.forEach((table) => {
		sLog(`  - ${table.name} (${table.columns.length} columns)`);
	});
}
