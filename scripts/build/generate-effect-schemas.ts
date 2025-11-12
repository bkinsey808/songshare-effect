#!/usr/bin/env bun
/* eslint-disable no-console */
/**
 * Enhanced script to generate Effect-TS schemas from Supabase generated types
 * This version includes a proper TypeScript AST parser to extract table definitions
 */
import { execFileSync } from "child_process";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
} from "fs";
import { dirname, join, relative } from "path";

import { safeGet } from "@/shared/utils/safe";

type ColumnDefinition = {
	name: string;
	type: string;
	nullable: boolean;
	isPrimaryKey?: boolean;
	isForeignKey?: boolean;
	referencedTable?: string;
	isRequiredForInsert?: boolean;
};

type TableDefinition = {
	name: string;
	columns: ColumnDefinition[];
};

function loadEnvVariables(envFilePath: string): Record<string, string> {
	const envEntries = new Map<string, string>();
	const content = readFileSync(envFilePath, "utf8");
	const lines = content.split(/\r?\n/);
	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (line === "" || line.startsWith("#")) {
			continue;
		}

		const normalized = line.startsWith("export ")
			? line.slice("export ".length)
			: line;
		const equalsIndex = normalized.indexOf("=");
		if (equalsIndex === -1) {
			continue;
		}

		const key = normalized.slice(0, equalsIndex).trim();
		if (key === "") {
			continue;
		}

		let value = normalized.slice(equalsIndex + 1).trim();
		if (
			(value.startsWith("\"") && value.endsWith("\"")) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (!/^[A-Z0-9_]+$/u.test(key)) {
			continue;
		}

		envEntries.set(key, value);
	}

	return Object.fromEntries(envEntries.entries());
}

function assertPathExists(params: Readonly<{ path: string; errorMessage: string }>): void {
	if (!existsSync(params.path)) {
		console.error(params.errorMessage);
		process.exit(1);
	}
}

type SupabaseGenerationConfig = {
	cliPath: string;
	projectRoot: string;
	tempTypesPath: string;
	env: NodeJS.ProcessEnv;
	projectRef: string;
};

type MoveSupabaseTypesConfig = {
	tempPath: string;
	destinationPath: string;
	generated: boolean;
};

// The config includes NodeJS.ProcessEnv which isn't readonly, so lint rule is disabled.
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
function generateSupabaseTypes(config: Readonly<SupabaseGenerationConfig>): boolean {
	console.log("📥 Generating Supabase TypeScript types...");
	if (existsSync(config.tempTypesPath)) {
		rmSync(config.tempTypesPath);
	}

	if (config.projectRef === "") {
		console.warn(
			"⚠️  SUPABASE_PROJECT_REF not set. Skipping remote Supabase type generation.",
		);
		return false;
	}

	try {
		const supabaseOutput = execFileSync(
			config.cliPath,
			[
				"gen",
				"types",
				"typescript",
				"--project-id",
				config.projectRef,
				"--schema",
				"public",
			],
			{
				cwd: config.projectRoot,
				env: config.env,
				encoding: "utf8",
			},
		);

		if (supabaseOutput.trim().length > 0) {
			writeFileSync(config.tempTypesPath, supabaseOutput, "utf8");
			console.log("✅ Successfully generated Supabase types");
			return true;
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("❌ Error generating Supabase types:", message);
	}

	console.log("⚠️  Failed to generate Supabase types from remote database");
	console.log("This could be due to:");
	console.log("  • Temporary Supabase API issues");
	console.log("  • Project not found or no public schema");
	console.log("  • Network connectivity issues");
	console.log("");
	console.log("🔧 Falling back to example schemas...");
	if (existsSync(config.tempTypesPath)) {
		rmSync(config.tempTypesPath);
	}
	return false;
}

function moveSupabaseTypes(config: Readonly<MoveSupabaseTypesConfig>): string | undefined {
	if (!config.generated || !existsSync(config.tempPath)) {
		console.log("📁 No types file to move (using fallback schemas)");
		return undefined;
	}

	console.log("📁 Moving Supabase types to shared/src/generated directory...");
	try {
		mkdirSync(dirname(config.destinationPath), { recursive: true });
		renameSync(config.tempPath, config.destinationPath);
		return config.destinationPath;
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn("Warning: could not move Supabase types:", message);
		if (existsSync(config.tempPath)) {
			rmSync(config.tempPath);
		}
		return undefined;
	}
}

function logGeneratedTables(tables: ReadonlyArray<TableDefinition>): void {
	console.log(`📊 Generated schemas for ${tables.length} tables:`);
	tables.forEach((table) => {
		console.log(`  - ${table.name} (${table.columns.length} columns)`);
	});
}

function runEslintFix(
	params: Readonly<{
		projectRoot: string;
		files: ReadonlyArray<string>;
		cliPath: string;
	}>,
): void {
	if (params.files.length === 0) {
		return;
	}

	console.log("🔧 Running ESLint fix on generated files...");
	try {
		execFileSync(
			params.cliPath,
			["--no-warn-ignored", ...params.files, "--fix"],
			{
				cwd: params.projectRoot,
				stdio: "pipe",
			},
		);
		console.log("✅ ESLint fix completed on generated schemas");
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn("⚠️  ESLint fix failed:", message);
	}
}

function runPrettierWrite(
	params: Readonly<{
		projectRoot: string;
		files: ReadonlyArray<string>;
		cliPath: string;
	}>,
): void {
	if (params.files.length === 0) {
		return;
	}

	console.log("🔧 Running Prettier on generated files...");
	try {
		execFileSync(params.cliPath, ["--write", ...params.files], {
			cwd: params.projectRoot,
			stdio: "inherit",
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn("⚠️  Prettier format failed:", message);
	}
}

function logFinalSummary(
	params: Readonly<{
		projectRoot: string;
		schemasPath: string;
		supabaseTypesPath?: string;
	}>,
): void {
	console.log("✅ Effect-TS schemas generated successfully!");
	console.log("📁 Generated files:");
	console.log(
		`  • ${relative(params.projectRoot, params.schemasPath)} (Effect schemas)`,
	);
	if (params.supabaseTypesPath !== undefined) {
		console.log(
			`  • ${relative(params.projectRoot, params.supabaseTypesPath)} (Raw Supabase types)`,
		);
	}

	console.log("");
	console.log("Next steps:");
	console.log("  1. Review and adjust the generated schemas");
	console.log("  2. Import them in your API and frontend code");
	console.log("  3. Replace manual schema definitions where appropriate");
}

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

// eslint-disable-next-line sonarjs/cognitive-complexity
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
		// table_name: {
		//   Row: { field: type | null }
		//   Insert: { field?: type | null, requiredField: type }
		// }

		// Extract table definitions using regex to capture Row and Insert types
		const tableMatches = content.matchAll(
			// eslint-disable-next-line sonarjs/slow-regex
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
				// Skip the Tables wrapper or invalid matches
				continue;
			}

			console.log(`📋 Processing table: ${tableName}`);

			const columns: ColumnDefinition[] = [];

			// Parse Insert type to determine which fields are required for inserts
			const insertRequiredFields = new Set<string>();
			const insertFieldMatches = insertContent.matchAll(
				// eslint-disable-next-line sonarjs/slow-regex
				/(\w+)(\?)?:\s*([^;\n]+)/g,
			);

			for (const insertMatch of insertFieldMatches) {
				const fieldName = insertMatch[1]?.trim();
				const isOptional = insertMatch[2] === "?";

				if (fieldName !== undefined && fieldName !== "" && !isOptional) {
					insertRequiredFields.add(fieldName);
				}
			}

			// Extract field definitions from Row type
			// eslint-disable-next-line sonarjs/slow-regex
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
					// Skip invalid field matches
					continue;
				}

				// Handle nullable types (type | null)
				const isNullable = fieldType.includes("| null");
				// eslint-disable-next-line sonarjs/slow-regex
				const cleanType = fieldType.replace(/\s*\|\s*null\s*$/, "").trim();

				// Preserve array types (e.g., string[] or number[]) so downstream mapping
				// can produce Schema.Array(...) instead of falling back to plain string.
				const isArrayType = /\[\]$/.test(cleanType);

				// Map TypeScript types to our internal types. Keep array suffix if present.
				// default
				let mappedType = "string";

				if (isArrayType) {
					// Keep the array marker (e.g. "string[]") so getEffectType can
					// generate Schema.Array(...) appropriately.
					// e.g. "string[]"
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

function getEffectType(column: Readonly<ColumnDefinition>): string {
	let effectType = typeMapping[column.type];
	if (effectType === undefined) {
		// If the column.type retains an array marker (e.g. "string[]"), map
		// the element type and wrap it in Schema.Array(...)
		if (/\[\]$/.test(column.type)) {
			const elemType = column.type.replace(/\[\]$/, "");
			const mappedElem = safeGet(typeMapping, elemType) ?? "Schema.String";
			// If mapping returned a bare name like "Schema.String", keep it.
			effectType = `Schema.Array(${mappedElem})`;
		} else {
			effectType = "Schema.String";
		}
	}

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

function getTypeAnnotation(effectType: string): string {
	// Convert runtime Effect types to type annotations
	if (effectType.startsWith("Schema.Array(")) {
		// Extract inner representation and recursively compute its annotation
		const inner = effectType.slice("Schema.Array(".length, -1);
		return `Schema.Array$<${getTypeAnnotation(inner)}>`;
	}

	// For most types, the type annotation is "typeof " + the type
	if (effectType.startsWith("Schema.optional(")) {
		// Remove "Schema.optional(" and ")"
		const innerType = effectType.slice(16, -1);
		return `Schema.optional<${getTypeAnnotation(innerType)}>`;
	}

	return `typeof ${effectType}`;
}

function generateEffectSchema(table: Readonly<TableDefinition>): string {
	// eslint-disable-next-line prefer-template
	const schemaName = toPascalCase(table.name) + "Schema";
	const typeName = toPascalCase(table.name);

	let output = `// ${table.name} table schemas\n`;

	// Main table schema with explicit type annotation
	output += `export const ${schemaName}: Schema.Struct<{\n`;

	table.columns.forEach((column) => {
		let fieldSchema = getEffectType(column);
		let typeAnnotation = getTypeAnnotation(fieldSchema);

		if (column.nullable) {
			// eslint-disable-next-line sonarjs/no-dead-store
			fieldSchema = `Schema.optional(${fieldSchema})`;
			typeAnnotation = `Schema.optional<${getTypeAnnotation(getEffectType(column))}>`;
		}

		output += `\t${column.name}: ${typeAnnotation};\n`;
	});

	output += "}> = Schema.Struct({\n";

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
		output += `export const ${insertSchemaName}: Schema.Struct<{\n`;

		insertColumns.forEach((column) => {
			let fieldSchema = getEffectType(column);
			let typeAnnotation = getTypeAnnotation(fieldSchema);

			// Use database-driven approach: field is optional if not required for insert OR nullable
			if (column.isRequiredForInsert !== true || column.nullable) {
				// eslint-disable-next-line sonarjs/no-dead-store
				fieldSchema = `Schema.optional(${fieldSchema})`;
				typeAnnotation = `Schema.optional<${getTypeAnnotation(getEffectType(column))}>`;
			}

			output += `\t${column.name}: ${typeAnnotation};\n`;
		});

		output += "}> = Schema.Struct({\n";

		insertColumns.forEach((column) => {
			let fieldSchema = getEffectType(column);

			// Use database-driven approach: field is optional if not required for insert OR nullable
			if (column.isRequiredForInsert !== true || column.nullable) {
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
	output += `export const ${updateSchemaName}: Schema.Struct<{\n`;

	table.columns.forEach((column, _index) => {
		if (autoGeneratedFields.includes(column.name) && column.name !== "id") {
			// Skip auto-generated fields except id
			return;
		}

		let fieldSchema = getEffectType(column);
		let typeAnnotation = getTypeAnnotation(fieldSchema);

		if (column.name !== "id") {
			// eslint-disable-next-line sonarjs/no-dead-store
			fieldSchema = `Schema.optional(${fieldSchema})`;
			typeAnnotation = `Schema.optional<${getTypeAnnotation(getEffectType(column))}>`;
		}

		output += `\t${column.name}: ${typeAnnotation};\n`;
	});

	output += "}> = Schema.Struct({\n";

	table.columns.forEach((column, _index) => {
		if (autoGeneratedFields.includes(column.name) && column.name !== "id") {
			// Skip auto-generated fields except id
			return;
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
	let fileContent = `/**
 * ⚠️  GENERATED FILE - DO NOT EDIT DIRECTLY
 * 
 * This file was automatically generated by:
 * File: scripts/build/generateEffectSchemas.ts
* Command: npm run supabase:generate
 * 
 * Generated Effect-TS schemas from Supabase database types
 * Last generated: ${new Date().toISOString()}
 * 
 * To regenerate this file, run:
 * npm run supabase:generate
 * 
 * Any manual changes to this file will be overwritten on next generation.
 */
import { Schema } from "effect";
`;

	// Add common helper schemas
	fileContent += `
// Common validation schemas
export const NonEmptyStringSchema: typeof Schema.NonEmptyString =
	Schema.NonEmptyString;
export const EmailSchema: Schema.Schema<string, string, never> = Schema.String.pipe(
	Schema.nonEmptyString(),
	Schema.pattern(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/),
);
export const UUIDSchema: typeof Schema.UUID = Schema.UUID;
export const PositiveNumberSchema: typeof Schema.Positive = Schema.Positive;
export const NonNegativeNumberSchema: typeof Schema.NonNegative =
	Schema.NonNegative;

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
const _ApiSuccessResponseSchemaImpl = <A, I, R>(
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

const _ApiErrorResponseSchemaImpl: Schema.Struct<{
	success: Schema.Literal<[false]>;
	error: typeof Schema.String;
	message: Schema.optional<typeof Schema.String>;
}> = Schema.Struct({
	success: Schema.Literal(false),
	error: Schema.String,
	message: Schema.optional(Schema.String),
});

export const ApiSuccessResponseSchema = <A, I, R>(
	dataSchema: Schema.Schema<A, I, R>,
): Schema.Schema<
	Schema.Schema.Type<ReturnType<typeof _ApiSuccessResponseSchemaImpl<A, I, R>>>,
	Schema.Schema.Encoded<ReturnType<typeof _ApiSuccessResponseSchemaImpl<A, I, R>>>,
	Schema.Schema.Context<ReturnType<typeof _ApiSuccessResponseSchemaImpl<A, I, R>>>
> => _ApiSuccessResponseSchemaImpl(dataSchema);

export const ApiErrorResponseSchema: Schema.Schema<
	Schema.Schema.Type<typeof _ApiErrorResponseSchemaImpl>,
	Schema.Schema.Encoded<typeof _ApiErrorResponseSchemaImpl>,
	Schema.Schema.Context<typeof _ApiErrorResponseSchemaImpl>
> = _ApiErrorResponseSchemaImpl;

export const ApiResponseSchema = <A, I, R>(
	dataSchema: Schema.Schema<A, I, R>,
): Schema.Schema<
	| Schema.Schema.Type<ReturnType<typeof _ApiSuccessResponseSchemaImpl<A, I, R>>>
	| Schema.Schema.Type<typeof _ApiErrorResponseSchemaImpl>,
	| Schema.Schema.Encoded<ReturnType<typeof _ApiSuccessResponseSchemaImpl<A, I, R>>>
	| Schema.Schema.Encoded<typeof _ApiErrorResponseSchemaImpl>,
	| Schema.Schema.Context<ReturnType<typeof _ApiSuccessResponseSchemaImpl<A, I, R>>>
	| Schema.Schema.Context<typeof _ApiErrorResponseSchemaImpl>
> => Schema.Union(ApiSuccessResponseSchema(dataSchema), ApiErrorResponseSchema);

export type ApiResponse<T> =
	| { success: true; data?: T; message?: string }
	| { success: false; error: string; message?: string };
`;

	// Ensure the output directory exists
	const outputDir = dirname(outputPath);
	if (!existsSync(outputDir)) {
		mkdirSync(outputDir, { recursive: true });
	}

	writeFileSync(outputPath, fileContent, "utf-8");
	console.log(`✅ Generated Effect schemas at: ${outputPath}`);
}

// Main execution
async function main(): Promise<void> {
	const projectRoot = process.cwd();
	const tempSupabaseTypesPath = join(projectRoot, "temp-supabase-types.ts");
	const sharedGeneratedDir = join(projectRoot, "shared", "src", "generated");
	const supabaseTypesDestination = join(sharedGeneratedDir, "supabaseTypes.ts");
	const schemasOutputPath = join(sharedGeneratedDir, "supabaseSchemas.ts");

	console.log("🚀 Generating Effect-TS schemas from Supabase...");

	const envPath = join(projectRoot, ".env");
	assertPathExists({
		path: envPath,
		errorMessage: "❌ .env file not found. Please create one with SUPABASE_PROJECT_REF",
	});

	const supabaseCliPath = join(projectRoot, "node_modules", ".bin", "supabase");
	assertPathExists({
		path: supabaseCliPath,
		errorMessage: "❌ Supabase CLI not found. Install it with: npm install -D supabase",
	});

	const eslintCliPath = join(projectRoot, "node_modules", ".bin", "eslint");
	assertPathExists({
		path: eslintCliPath,
		errorMessage: "❌ ESLint binary not found. Install it with: npm install -D eslint",
	});

	const prettierCliPath = join(projectRoot, "node_modules", ".bin", "prettier");
	assertPathExists({
		path: prettierCliPath,
		errorMessage: "❌ Prettier binary not found. Install it with: npm install -D prettier",
	});

	const envFromFile = loadEnvVariables(envPath);
	const mergedEnv = { ...process.env, ...envFromFile } as NodeJS.ProcessEnv;
	const projectRef = mergedEnv["SUPABASE_PROJECT_REF"] ?? "";

	const supabaseTypesGenerated = generateSupabaseTypes({
		cliPath: supabaseCliPath,
		projectRoot,
		tempTypesPath: tempSupabaseTypesPath,
		env: mergedEnv,
		projectRef,
	});

	console.log("⚡ Converting to Effect-TS schemas...");
	console.log("🔄 Parsing Supabase types...");
	const tables = parseSupabaseTypes(tempSupabaseTypesPath);
	logGeneratedTables(tables);

	console.log("⚡ Generating Effect schemas...");
	generateEffectSchemasFile(tables, schemasOutputPath);

	const supabaseTypesFinalPath = moveSupabaseTypes({
		tempPath: tempSupabaseTypesPath,
		destinationPath: supabaseTypesDestination,
		generated: supabaseTypesGenerated,
	});

	const lintTargets: ReadonlyArray<string> =
		supabaseTypesFinalPath === undefined
			? [schemasOutputPath]
			: [schemasOutputPath, supabaseTypesFinalPath];

	runEslintFix({
		projectRoot,
		files: lintTargets,
		cliPath: eslintCliPath,
	});
	runPrettierWrite({
		projectRoot,
		files: lintTargets,
		cliPath: prettierCliPath,
	});

	if (supabaseTypesFinalPath === undefined && existsSync(tempSupabaseTypesPath)) {
		rmSync(tempSupabaseTypesPath);
	}

	const summaryConfig =
		supabaseTypesFinalPath === undefined
			? { projectRoot, schemasPath: schemasOutputPath }
			: {
				projectRoot,
				schemasPath: schemasOutputPath,
				supabaseTypesPath: supabaseTypesFinalPath,
			};

	logFinalSummary(summaryConfig);
}

if (import.meta.main) {
	void main();
}
