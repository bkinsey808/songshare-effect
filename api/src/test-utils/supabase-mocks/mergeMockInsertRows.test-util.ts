import type { MockRow } from "./supabase-mock-types";

function mergeMockInsertRows<TRow extends object>(
	rows: readonly TRow[],
	overrideRows?: readonly (MockRow<TRow> | undefined)[],
): (TRow | MockRow<TRow> | undefined)[] {
	if (overrideRows === undefined) {
		return [...rows];
	}

	const mergedLength = Math.max(rows.length, overrideRows.length);

	return Array.from({ length: mergedLength }, (_unusedValue, index) => {
		const baseRow = rows[index];
		const overrideRow = overrideRows[index];
		const hasOverrideAtIndex = index in overrideRows;

		if (hasOverrideAtIndex && overrideRow === undefined) {
			return undefined;
		}

		if (overrideRow === undefined) {
			return baseRow;
		}

		if (baseRow === undefined) {
			return overrideRow;
		}

		return {
			...baseRow,
			...overrideRow,
		};
	});
}

export default mergeMockInsertRows;
