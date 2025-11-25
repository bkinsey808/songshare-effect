import { existsSync, readFileSync } from "fs";

import type {
	ColumnDefinition,
	TableDefinition,
} from "./generate-effect-schemas-types";

import { createExampleSchemas } from "./createExampleSchemas";

export function parseSupabaseTypes(filePath: string): TableDefinition[] {
	if (!existsSync(filePath)) {
		console.log(`⚠️  Supabase types file not found: ${filePath}`);
		console.log(
			"🔧 Creating example schemas based on your existing codebase...",
		);
		return createExampleSchemas();
	}

	const content = readFileSync(filePath, "utf-8");
	const tables: TableDefinition[] = [];

	try {
		const tableMatches = content.matchAll(
			/(\w+):\s*{\s*Row:\s*{([^}]+)}\s*Insert:\s*{([^}]+)}/gs,
		);

		for (const match of tableMatches) {
			const tableName = match[1];
			const rowContent = match[2];
			const insertContent = match[3];

			if (
				tableName === "Tables" ||
				tableName === undefined ||
				tableName === "" ||
				rowContent === undefined ||
				rowContent === "" ||
				insertContent === undefined ||
				insertContent === ""
			) {
				continue;
			}

			console.log(`📋 Processing table: ${tableName}`);

			const columns: ColumnDefinition[] = [];

			const insertRequiredFields = new Set<string>();
			const insertFieldMatches = insertContent.matchAll(
				/(\w+)(\?)?:\s*([^;\n]+)/g,
			);

			for (const insertMatch of insertFieldMatches) {
				const fieldName = insertMatch[1]?.trim();
				const isOptional = insertMatch[2] === "?";

				if (fieldName !== undefined && fieldName !== "" && !isOptional) {
					insertRequiredFields.add(fieldName);
				}
			}

			const fieldMatches = rowContent.matchAll(/(\w+):\s*([^;\n]+)/g);

			for (const fieldMatch of fieldMatches) {
				const fieldName = fieldMatch[1]?.trim();
				const fieldType = fieldMatch[2]?.trim();

				if (
					fieldName === undefined ||
					fieldName === "" ||
					fieldType === undefined ||
					fieldType === ""
				) {
					continue;
				}

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

			if (columns.length > 0) {
				tables.push({ name: tableName, columns });
			}
		}

		if (tables.length === 0) {
			console.log(
				"⚠️  No tables found in Supabase types. Using example schemas...",
			);
			return createExampleSchemas();
		}

		return tables;
	} catch (error) {
		console.error("❌ Error parsing Supabase types:", error);
		console.log("🔧 Falling back to example schemas...");
		return createExampleSchemas();
	}
}
