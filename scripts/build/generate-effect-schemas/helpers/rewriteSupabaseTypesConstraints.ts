import { readFileSync, writeFileSync } from "node:fs";

/**
 * Post-process a generated `supabaseTypes.ts` file in-place, replacing `string`
 * with the correct union literal type for columns that have a CHECK constraint.
 *
 * The Supabase CLI emits `string` for all text columns regardless of constraints.
 * This helper reads the constraint map (derived from `schema.sql`) and rewrites
 * each table block so that constrained columns carry their precise type, e.g.
 *   `slide_number_preference: "show" | "hide"` instead of `string`.
 *
 * @param filePath - Absolute path to the `supabaseTypes.ts` file to rewrite.
 * @param constraintMap - Map of tableName → columnName → allowed string values.
 */
export default function rewriteSupabaseTypesConstraints(
	filePath: string,
	constraintMap: Readonly<Record<string, Record<string, readonly string[]>>>,
): void {
	let content = readFileSync(filePath, "utf8");

	for (const [tableName, columns] of Object.entries(constraintMap)) {
		// Match the table block: from "      tableName: {" through its closing "      }"
		// at the same 6-space indentation level.
		const tableBlockRegex = new RegExp(
			`(      ${tableName}: \\{[\\s\\S]+?\\n      \\})`,
			"g",
		);

		content = content.replace(tableBlockRegex, (tableBlock) => {
			let modifiedBlock = tableBlock;

			for (const [colName, values] of Object.entries(columns)) {
				const unionType = values.map((val) => `"${val}"`).join(" | ");
				const nullableColRegex = new RegExp(`(\\b${colName})(\\??): string \\| null\\b`, "g");
				modifiedBlock = modifiedBlock.replace(nullableColRegex, `$1$2: ${unionType} | null`);

				// Matches both `colName: string` (Row) and `colName?: string` (Insert/Update).
				const colRegex = new RegExp(`(\\b${colName})(\\??): string\\b`, "g");
				modifiedBlock = modifiedBlock.replace(colRegex, `$1$2: ${unionType}`);
			}

			return modifiedBlock;
		});
	}

	writeFileSync(filePath, content, "utf8");
}
