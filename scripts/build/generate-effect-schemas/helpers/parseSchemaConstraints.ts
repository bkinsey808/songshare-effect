const MIN_VALUES = 1;
const NO_CONSTRAINTS = 0;
const constraintPatterns = [
	/CONSTRAINT\s+\w+\s+CHECK\s+\(\((\w+)\s*=\s*ANY\s*\(ARRAY\[([^\]]+)\]\)\)\)/g,
	/CONSTRAINT\s+\w+\s+CHECK\s+\(\(\((\w+)\s+IS\s+NULL\)\s+OR\s+\(\1\s*=\s*ANY\s*\(ARRAY\[([^\]]+)\]\)\)\)\)/g,
];

/**
 * Parse a pg_dump schema SQL file and extract columns whose values are
 * constrained to a fixed set of literals via CHECK (col = ANY (ARRAY[...]))
 * or CHECK ((col IS NULL) OR (col = ANY (ARRAY[...]))).
 *
 * @param schemaSql - Full contents of the exported schema.sql file.
 * @returns A two-level map: tableName → columnName → allowed string values.
 */

/**
 * Parse `CHECK (col = ANY (ARRAY[...]))` constraints from a CREATE TABLE body
 * and return a map of columnName → allowed values.
 *
 * @param tableBody - The content between the outer parentheses of CREATE TABLE.
 * @returns Map of column name to its allowed literal values.
 */
function extractTableConstraints(tableBody: string): Record<string, readonly string[]> {
	const constraintsForTable: Record<string, readonly string[]> = {};
	for (const constraintPattern of constraintPatterns) {
		for (const constraintMatch of tableBody.matchAll(constraintPattern)) {
			const [, colName, arrayContent] = constraintMatch as RegExpMatchArray;
			if (typeof colName === "string" && typeof arrayContent === "string") {
				const values = extractArrayValues(arrayContent);
				if (values.length >= MIN_VALUES) {
					constraintsForTable[colName] = values;
				}
			}
		}
	}

	return constraintsForTable;
}

/**
 * Extract string literal values from an `ARRAY['v1'::text, 'v2'::text]` SQL fragment.
 *
 * @param arrayContent - The content between the square brackets.
 * @returns An array of extracted string values.
 */
function extractArrayValues(arrayContent: string): string[] {
	const values: string[] = [];
	const valueRegex = /'([^']+)'(?:::\w+)?/g;
	for (const valueMatch of arrayContent.matchAll(valueRegex)) {
		const [, val] = valueMatch as RegExpMatchArray;
		if (typeof val === "string") {
			values.push(val);
		}
	}
	return values;
}

export default function parseSchemaConstraints(
	schemaSql: string,
): Record<string, Record<string, readonly string[]>> {
	const result: Record<string, Record<string, readonly string[]>> = {};

	// Match each CREATE TABLE block.
	// Table names may be unquoted (community) or double-quoted ("user").
	const tableRegex = /CREATE TABLE public\."?(\w+)"?\s*\(([\s\S]*?)\n\);/g;

	for (const tableMatch of schemaSql.matchAll(tableRegex)) {
		const [, rawTableName, tableBody] = tableMatch as RegExpMatchArray;
		if (typeof rawTableName === "string" && typeof tableBody === "string") {
			const constraintsForTable = extractTableConstraints(tableBody);
			if (Object.keys(constraintsForTable).length > NO_CONSTRAINTS) {
				result[rawTableName] = constraintsForTable;
			}
		}
	}

	return result;
}
