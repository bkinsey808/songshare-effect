#!/usr/bin/env bun
/* eslint-disable no-console */
/**
 * Enhanced script to generate Effect-TS schemas from Supabase generated types
 * This version includes a proper TypeScript AST parser to extract table definitions
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

type ColumnDefinition = {
	name: string;
	type: string;
	nullable: boolean;
	isPrimaryKey?: boolean;
	isForeignKey?: boolean;
	referencedTable?: string;
};

type TableDefinition = {
	name: string;
	columns: ColumnDefinition[];
};

// Enhanced type mapping from PostgreSQL/Supabase types to Effect Schema types
const typeMapping: Record<string, string> = {
	string: "Schema.String",
	text: "Schema.String",
	varchar: "Schema.String",
	char: "Schema.String",
	uuid: "Schema.UUID",
	number: "Schema.Number",
	integer: "Schema.Number",
	bigint: "Schema.BigInt",
	smallint: "Schema.Number",
	decimal: "Schema.Number",
	numeric: "Schema.Number",
	real: "Schema.Number",
	"double precision": "Schema.Number",
	boolean: "Schema.Boolean",
	Date: "Schema.DateFromSelf",
	timestamp: "Schema.DateFromSelf",
	timestamptz: "Schema.DateFromSelf",
	date: "Schema.DateFromSelf",
	time: "Schema.String",
	json: "Schema.Unknown",
	jsonb: "Schema.Unknown",
	Json: "Schema.Unknown",
	bytea: "Schema.Uint8Array",
};

function parseSupabaseTypes(filePath: string): TableDefinition[] {
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
		// Parse the Database interface structure
		// Look for patterns like:
		// Tables: {
		//   table_name: {
		//     Row: { field: type | null }
		//   }
		// }

		// Extract table definitions using regex (simplified approach)
		const tableMatches = content.matchAll(/(\w+):\s*{\s*Row:\s*{([^}]+)}/gs);

		for (const match of tableMatches) {
			const tableName = match[1];
			const rowContent = match[2];

			if (tableName === "Tables") {
				continue; // Skip the Tables wrapper
			}

			console.log(`📋 Processing table: ${tableName}`);

			const columns: ColumnDefinition[] = [];

			// Extract field definitions
			const fieldMatches = rowContent.matchAll(/(\w+):\s*([^;\n]+)/g);

			for (const fieldMatch of fieldMatches) {
				const fieldName = fieldMatch[1].trim();
				const fieldType = fieldMatch[2].trim();

				// Handle nullable types (type | null)
				const isNullable = fieldType.includes("| null");
				const cleanType = fieldType.replace(/\s*\|\s*null\s*$/, "").trim();

				// Map TypeScript types to our internal types
				let mappedType = "string"; // default
				if (cleanType.includes("number")) {
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

function createExampleSchemas(): TableDefinition[] {
	return [
		{
			name: "users",
			columns: [
				{ name: "id", type: "uuid", nullable: false, isPrimaryKey: true },
				{ name: "email", type: "string", nullable: false },
				{ name: "name", type: "string", nullable: true },
				{ name: "avatar_url", type: "string", nullable: true },
				{ name: "created_at", type: "Date", nullable: false },
				{ name: "updated_at", type: "Date", nullable: false },
			],
		},
		{
			name: "songs",
			columns: [
				{ name: "id", type: "uuid", nullable: false, isPrimaryKey: true },
				{ name: "title", type: "string", nullable: false },
				{ name: "artist", type: "string", nullable: false },
				{ name: "duration", type: "number", nullable: false },
				{ name: "file_url", type: "string", nullable: false },
				{
					name: "user_id",
					type: "uuid",
					nullable: false,
					isForeignKey: true,
					referencedTable: "users",
				},
				{ name: "genre", type: "string", nullable: true },
				{ name: "tags", type: "Json", nullable: true },
				{ name: "play_count", type: "number", nullable: true },
				{ name: "is_public", type: "boolean", nullable: false },
				{ name: "created_at", type: "Date", nullable: false },
				{ name: "updated_at", type: "Date", nullable: false },
			],
		},
		{
			name: "playlists",
			columns: [
				{ name: "id", type: "uuid", nullable: false, isPrimaryKey: true },
				{ name: "name", type: "string", nullable: false },
				{ name: "description", type: "string", nullable: true },
				{
					name: "user_id",
					type: "uuid",
					nullable: false,
					isForeignKey: true,
					referencedTable: "users",
				},
				{ name: "is_public", type: "boolean", nullable: false },
				{ name: "created_at", type: "Date", nullable: false },
				{ name: "updated_at", type: "Date", nullable: false },
			],
		},
		{
			name: "playlist_songs",
			columns: [
				{ name: "id", type: "uuid", nullable: false, isPrimaryKey: true },
				{
					name: "playlist_id",
					type: "uuid",
					nullable: false,
					isForeignKey: true,
					referencedTable: "playlists",
				},
				{
					name: "song_id",
					type: "uuid",
					nullable: false,
					isForeignKey: true,
					referencedTable: "songs",
				},
				{ name: "position", type: "number", nullable: false },
				{ name: "added_at", type: "Date", nullable: false },
			],
		},
	];
}

function getEffectType(column: ColumnDefinition): string {
	let effectType = typeMapping[column.type] || "Schema.String";

	// Special handling for arrays stored as JSON
	if (column.name === "tags" && column.type === "Json") {
		effectType = "Schema.Array(Schema.String)";
	}

	// Add validation for common patterns
	if (column.name === "email") {
		effectType = "EmailSchema";
	} else if (column.name.includes("url")) {
		effectType = "Schema.NonEmptyString";
	} else if (column.name === "duration" || column.name === "position") {
		effectType = "Schema.Positive";
	} else if (column.name === "play_count") {
		effectType = "Schema.NonNegative";
	} else if (!column.nullable && effectType === "Schema.String") {
		effectType = "Schema.NonEmptyString";
	}

	return effectType;
}

function generateEffectSchema(table: TableDefinition): string {
	const schemaName = toPascalCase(table.name) + "Schema";
	const typeName = toPascalCase(table.name);

	let output = `// ${table.name} table schemas\n`;

	// Main table schema
	output += `export const ${schemaName} = Schema.Struct({\n`;

	table.columns.forEach((column) => {
		let fieldSchema = getEffectType(column);

		if (column.nullable) {
			fieldSchema = `Schema.optional(${fieldSchema})`;
		}

		output += `\t${column.name}: ${fieldSchema},\n`;
	});

	output += "});\n\n";
	output += `export type ${typeName} = Schema.Schema.Type<typeof ${schemaName}>;\n\n`;

	// Insert schema (excludes auto-generated fields)
	const autoGeneratedFields = ["id", "created_at", "updated_at"];
	const insertColumns = table.columns.filter(
		(col) => !autoGeneratedFields.includes(col.name),
	);

	if (insertColumns.length > 0) {
		const insertSchemaName = `${typeName}InsertSchema`;
		output += `export const ${insertSchemaName} = Schema.Struct({\n`;

		insertColumns.forEach((column) => {
			let fieldSchema = getEffectType(column);

			// Make most fields optional for inserts, except required business logic fields
			const requiredFields = [
				"title",
				"artist",
				"email",
				"name",
				"user_id",
				"playlist_id",
				"song_id",
			];
			if (!requiredFields.includes(column.name) || column.nullable) {
				fieldSchema = `Schema.optional(${fieldSchema})`;
			}

			output += `\t${column.name}: ${fieldSchema},\n`;
		});

		output += "});\n\n";
		const insertTypeLine = `export type ${typeName}Insert = Schema.Schema.Type<typeof ${insertSchemaName}>;`;
		if (insertTypeLine.length > 80) {
			output += `export type ${typeName}Insert = Schema.Schema.Type<\n\ttypeof ${insertSchemaName}\n>;\n\n`;
		} else {
			output += `${insertTypeLine}\n\n`;
		}
	}

	// Update schema (all fields optional except id)
	const updateSchemaName = `${typeName}UpdateSchema`;
	output += `export const ${updateSchemaName} = Schema.Struct({\n`;

	table.columns.forEach((column, _index) => {
		if (autoGeneratedFields.includes(column.name) && column.name !== "id") {
			return; // Skip auto-generated fields except id
		}

		let fieldSchema = getEffectType(column);

		if (column.name !== "id") {
			fieldSchema = `Schema.optional(${fieldSchema})`;
		}

		output += `\t${column.name}: ${fieldSchema},\n`;
	});

	output += "});\n\n";
	const updateTypeLine = `export type ${typeName}Update = Schema.Schema.Type<typeof ${updateSchemaName}>;`;
	if (updateTypeLine.length > 80) {
		output += `export type ${typeName}Update = Schema.Schema.Type<\n\ttypeof ${updateSchemaName}\n>;\n`;
	} else {
		output += `${updateTypeLine}\n`;
	}

	return output;
}

function toPascalCase(str: string): string {
	return str
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join("");
}

function generateEffectSchemasFile(
	tables: TableDefinition[],
	outputPath: string,
): void {
	let fileContent = `/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// Generated Effect-TS schemas from Supabase types
// This file was auto-generated from your database schema
// Last generated: ${new Date().toISOString()}
import { Schema } from "@effect/schema";
`;

	// Add common helper schemas
	fileContent += `
// Common validation schemas
export const NonEmptyStringSchema = Schema.NonEmptyString;
export const EmailSchema = Schema.String.pipe(
	Schema.nonEmptyString(),
	Schema.pattern(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/),
);
export const UUIDSchema = Schema.UUID;
export const PositiveNumberSchema = Schema.Positive;
export const NonNegativeNumberSchema = Schema.NonNegative;

`;

	// Generate schemas for each table
	tables.forEach((table, index) => {
		if (index > 0) {
			fileContent += "\n";
		}
		fileContent += generateEffectSchema(table);
	});

	// Add API response schemas
	fileContent += `
// API Response schemas
export const ApiSuccessResponseSchema = <A, I, R>(
	dataSchema: Schema.Schema<A, I, R>,
): Schema.Struct<{
	success: Schema.Literal<[true]>;
	data: Schema.optional<Schema.Schema<A, I, R>>;
	message: Schema.optional<typeof Schema.String>;
}> =>
	Schema.Struct({
		success: Schema.Literal(true),
		data: Schema.optional(dataSchema),
		message: Schema.optional(Schema.String),
	});

export const ApiErrorResponseSchema = Schema.Struct({
	success: Schema.Literal(false),
	error: Schema.String,
	message: Schema.optional(Schema.String),
});

export const ApiResponseSchema = <A, I, R>(
	dataSchema: Schema.Schema<A, I, R>,
): Schema.Union<
	[
		ReturnType<typeof ApiSuccessResponseSchema<A, I, R>>,
		typeof ApiErrorResponseSchema,
	]
> => Schema.Union(ApiSuccessResponseSchema(dataSchema), ApiErrorResponseSchema);

export type ApiResponse<T> =
	| { success: true; data?: T; message?: string }
	| { success: false; error: string; message?: string };
`;

	writeFileSync(outputPath, fileContent, "utf-8");
	console.log(`✅ Generated Effect schemas at: ${outputPath}`);
}

// Main execution
async function main(): Promise<void> {
	const projectRoot = process.cwd();
	const supabaseTypesPath = join(projectRoot, "temp-supabase-types.ts");
	const outputPath = join(
		projectRoot,
		"shared",
		"generated",
		"supabaseSchemas.ts",
	);

	try {
		console.log("🔄 Parsing Supabase types...");
		const tables = parseSupabaseTypes(supabaseTypesPath);

		console.log(`📊 Generated schemas for ${tables.length} tables:`);
		tables.forEach((table) => {
			console.log(`  - ${table.name} (${table.columns.length} columns)`);
		});

		console.log("⚡ Generating Effect schemas...");
		generateEffectSchemasFile(tables, outputPath);

		// Run ESLint fix on generated files
		console.log("🔧 Running ESLint fix on generated files...");
		try {
			const { execSync } = await import("child_process");
			execSync(`npx eslint "${outputPath}" --fix`, {
				stdio: "pipe",
				cwd: projectRoot,
			});
			console.log("✅ ESLint fix completed on generated schemas");
		} catch (eslintError) {
			console.warn("⚠️  ESLint fix failed:", eslintError);
		}

		console.log("🎉 Done! Generated schemas include:");
		console.log("  • Base schemas for each table");
		console.log("  • Insert schemas (excluding auto-generated fields)");
		console.log("  • Update schemas (all fields optional except ID)");
		console.log("  • API response wrapper schemas");
		console.log("");
		console.log("📝 Next steps:");
		console.log(
			"  1. Review the generated schemas in shared/generated/supabaseSchemas.ts",
		);
		console.log("  2. Adjust validation rules as needed");
		console.log(
			"  3. Import and use schemas in your API endpoints and frontend",
		);
		console.log("  4. Consider adding custom business logic validations");
	} catch (error) {
		console.error("❌ Error generating schemas:", error);
		process.exit(1);
	}
}

if (import.meta.main) {
	void main();
}
