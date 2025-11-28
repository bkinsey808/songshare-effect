import { existsSync, readFileSync } from "fs";

import { warn as sWarn, error as sError } from "../../../utils/scriptLogger";
import { createExampleSchemas } from "./createExampleSchemas";
import {
	type ColumnDefinition,
	type TableDefinition,
} from "./generate-effect-schemas-types";

/**
 * Parse Supabase generated TypeScript types and return simplified table/column metadata.
 */
export function parseSupabaseTypes(filePath: string): TableDefinition[] {
	if (!existsSync(filePath)) {
		sWarn(`⚠️  Supabase types file not found: ${filePath}`);
		sWarn("🔧 Creating example schemas based on your existing codebase...");
		return createExampleSchemas();
	}

	const file = readFileSync(filePath, "utf-8");

	try {
		const tableRegex = /(\w+):\s*{\s*Row:\s*{([^}]+)}\s*Insert:\s*{([^}]+)}/gs;

		const tables: TableDefinition[] = [];
		const NO_COLUMNS = 0;

		for (const match of file.matchAll(tableRegex)) {
			// match[0] is the full match, groups start at index 1
			const [, tableName, rowContent, insertContent] = match;

			if (
				tableName === undefined ||
				tableName === "" ||
				tableName === "Tables" ||
				rowContent === undefined ||
				rowContent === "" ||
				insertContent === undefined ||
				insertContent === ""
			) {
				// malformed match — skip
			} else {
				sWarn(`📋 Processing table: ${tableName}`);

				// required insert fields
				const insertRequiredFields = new Set<string>();
				for (const im of insertContent.matchAll(/(\w+)(\?)?:\s*([^;\n]+)/g)) {
					const [, rawName, optional] = im;
					const field = rawName?.trim();
					const isOptional = optional === "?";
					if (field !== undefined && field !== "" && !isOptional) {
						insertRequiredFields.add(field);
					}
				}

				const columns: ColumnDefinition[] = [];
				for (const fm of rowContent.matchAll(/(\w+):\s*([^;\n]+)/g)) {
					const [, rawFieldName, rawFieldType] = fm;
					const fieldName = rawFieldName?.trim();
					const fieldType = rawFieldType?.trim();

					if (
						fieldName === undefined ||
						fieldName === "" ||
						fieldType === undefined ||
						fieldType === ""
					) {
						// skip invalid rows
					} else {
						const isNullable = fieldType.includes("| null");
						const cleanType = fieldType.replace(/\s*\|\s*null\s*$/, "").trim();
						const isArrayType = cleanType.endsWith("[]");

						let mappedType = "string";
						if (isArrayType) {
							mappedType = cleanType;
						} else if (cleanType.includes("number")) {
							mappedType = "number";
						} else if (cleanType.includes("boolean")) {
							mappedType = "boolean";
						} else if (cleanType.includes("Date")) {
							mappedType = "Date";
						} else if (cleanType.includes("Json")) {
							mappedType = "Json";
						} else if (fieldName.includes("id") && cleanType === "string") {
							mappedType = "uuid";
						}

						columns.push({
							name: fieldName,
							type: mappedType,
							nullable: isNullable,
							isPrimaryKey: fieldName === "id",
							isForeignKey: fieldName.endsWith("_id") && fieldName !== "id",
							isRequiredForInsert: insertRequiredFields.has(fieldName),
						});
					}

					if (columns.length > NO_COLUMNS) {
						tables.push({ name: tableName, columns });
					}
				}
			}
		}

		const NO_TABLES = 0;
		if (tables.length === NO_TABLES) {
			sWarn("⚠️  No tables found in Supabase types. Using example schemas...");
			return createExampleSchemas();
		}

		return tables;
	} catch (error) {
		sError("❌ Error parsing Supabase types:", error);
		sWarn("🔧 Falling back to example schemas...");
		return createExampleSchemas();
	}
}
