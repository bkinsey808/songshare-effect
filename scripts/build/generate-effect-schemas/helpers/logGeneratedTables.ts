import type { TableDefinition } from "./generate-effect-schemas-types";

export function logGeneratedTables(
	tables: ReadonlyArray<TableDefinition>,
): void {
	// oxlint-disable-next-line no-console
	console.log(`📊 Generated schemas for ${tables.length} tables:`);
	tables.forEach((table) => {
		// oxlint-disable-next-line no-console
		console.log(`  - ${table.name} (${table.columns.length} columns)`);
	});
}
