import type { TableDefinition } from "./generate-effect-schemas-types";

/**
 * Mutate each table's columns in-place, setting `allowedValues` on any column
 * that has a matching CHECK constraint in the provided map.
 *
 * @param tables - Mutable table definitions to enrich.
 * @param constraintMap - Map of tableName → columnName → allowed string values.
 */
const NO_VALUES = 0;

export default function enrichTablesWithConstraints(
	tables: TableDefinition[],
	constraintMap: Readonly<Record<string, Record<string, readonly string[]>>>,
): void {
	for (const table of tables) {
		const tableConstraints = constraintMap[table.name];
		if (tableConstraints !== undefined) {
			for (const column of table.columns) {
				const allowedValues = tableConstraints[column.name];
				if (allowedValues !== undefined && allowedValues.length > NO_VALUES) {
					column.allowedValues = allowedValues;
				}
			}
		}
	}
}
