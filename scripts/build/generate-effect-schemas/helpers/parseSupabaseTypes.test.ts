import { describe, expect, it, vi } from "vitest";

import type { TableDefinition } from "./generate-effect-schemas-types";
import parseSupabaseTypes from "./parseSupabaseTypes";

const {
	computeTablesMock,
	createExampleSchemasMock,
	existsSyncMock,
	readFileSyncMock,
	sErrorMock,
	sWarnMock,
} = vi.hoisted(() => ({
	computeTablesMock: vi.fn(),
	createExampleSchemasMock: vi.fn(),
	existsSyncMock: vi.fn(),
	readFileSyncMock: vi.fn(),
	sErrorMock: vi.fn(),
	sWarnMock: vi.fn(),
}));

vi.mock(import("node:fs"), async (importOriginal) => {
	const originalModule = await importOriginal();

	return {
		...originalModule,
		default: {
			...(originalModule.default ?? originalModule),
			existsSync: existsSyncMock,
			readFileSync: readFileSyncMock,
		},
		existsSync: existsSyncMock,
		readFileSync: readFileSyncMock,
	};
});

vi.mock(import("@/scripts/utils/scriptLogger"), () => ({
	error: sErrorMock,
	warn: sWarnMock,
}));

vi.mock(import("./computeTables"), () => ({
	default: computeTablesMock,
}));

vi.mock(import("./createExampleSchemas"), () => ({
	default: createExampleSchemasMock,
}));

const EXPECTED_WARN_CALLS_FOR_MISSING_FILE = 2;
const FIRST_CALL = 1;
const SECOND_CALL = 2;
const SINGLE_CALL = 1;

const parsedTables: TableDefinition[] = [
	{
		name: "songs",
		columns: [{ name: "title", type: "string", nullable: false }],
	},
];

const exampleSchemas: TableDefinition[] = [
	{
		name: "example",
		columns: [{ name: "id", type: "uuid", nullable: false, isPrimaryKey: true }],
	},
];

describe("parseSupabaseTypes", () => {
	it("returns computed tables when the types file exists and parsing succeeds", () => {
		// Arrange
		const filePath = "/tmp/supabaseTypes.ts";
		const fileContents = "export type Database = {}";

		vi.clearAllMocks();
		existsSyncMock.mockReturnValue(true);
		readFileSyncMock.mockReturnValue(fileContents);
		computeTablesMock.mockReturnValue(parsedTables);
		createExampleSchemasMock.mockReturnValue(exampleSchemas);

		// Act
		const result = parseSupabaseTypes(filePath);

		// Assert
		expect(result).toStrictEqual(parsedTables);
		expect({
			computeTablesCalls: computeTablesMock.mock.calls,
			createExampleSchemasCalls: createExampleSchemasMock.mock.calls,
			existsSyncCalls: existsSyncMock.mock.calls,
			readFileSyncCalls: readFileSyncMock.mock.calls,
			sErrorCalls: sErrorMock.mock.calls,
			sWarnCalls: sWarnMock.mock.calls,
		}).toStrictEqual({
			computeTablesCalls: [[fileContents]],
			createExampleSchemasCalls: [],
			existsSyncCalls: [[filePath]],
			readFileSyncCalls: [[filePath, "utf8"]],
			sErrorCalls: [],
			sWarnCalls: [],
		});
	});

	it("falls back to example schemas when the types file is missing", () => {
		// Arrange
		const filePath = "/tmp/missing-supabaseTypes.ts";

		vi.clearAllMocks();
		existsSyncMock.mockReturnValue(false);
		createExampleSchemasMock.mockReturnValue(exampleSchemas);

		// Act
		const result = parseSupabaseTypes(filePath);

		// Assert
		expect(result).toStrictEqual(exampleSchemas);
		expect({
			computeTablesCalls: computeTablesMock.mock.calls,
			createExampleSchemasCalls: createExampleSchemasMock.mock.calls,
			readFileSyncCalls: readFileSyncMock.mock.calls,
			sErrorCalls: sErrorMock.mock.calls,
			sWarnCalls: sWarnMock.mock.calls,
		}).toStrictEqual({
			computeTablesCalls: [],
			createExampleSchemasCalls: [[]],
			readFileSyncCalls: [],
			sErrorCalls: [],
			sWarnCalls: [
				[`⚠️  Supabase types file not found: ${filePath}`],
				["🔧 Creating example schemas based on your existing codebase..."],
			],
		});
		expect(sWarnMock).toHaveBeenCalledTimes(EXPECTED_WARN_CALLS_FOR_MISSING_FILE);
		expect(sWarnMock).toHaveBeenNthCalledWith(FIRST_CALL, `⚠️  Supabase types file not found: ${filePath}`);
		expect(sWarnMock).toHaveBeenNthCalledWith(SECOND_CALL, "🔧 Creating example schemas based on your existing codebase...");
	});

	it("falls back to example schemas when parsing returns no tables", () => {
		// Arrange
		const filePath = "/tmp/empty-supabaseTypes.ts";
		const fileContents = "export type Database = {}";

		vi.clearAllMocks();
		existsSyncMock.mockReturnValue(true);
		readFileSyncMock.mockReturnValue(fileContents);
		computeTablesMock.mockReturnValue([]);
		createExampleSchemasMock.mockReturnValue(exampleSchemas);

		// Act
		const result = parseSupabaseTypes(filePath);

		// Assert
		expect(result).toStrictEqual(exampleSchemas);
		expect(computeTablesMock).toHaveBeenCalledWith(fileContents);
		expect(createExampleSchemasMock).toHaveBeenCalledTimes(SINGLE_CALL);
		expect(sWarnMock).toHaveBeenCalledTimes(SINGLE_CALL);
		expect(sWarnMock).toHaveBeenCalledWith(
			"⚠️  No tables found in Supabase types. Using example schemas...",
		);
		expect(sErrorMock).not.toHaveBeenCalled();
	});

	it("falls back to example schemas when parsing throws", () => {
		// Arrange
		const filePath = "/tmp/invalid-supabaseTypes.ts";
		const fileContents = "export type Database = {}";
		const parseError = new Error("bad parse");

		vi.clearAllMocks();
		existsSyncMock.mockReturnValue(true);
		readFileSyncMock.mockReturnValue(fileContents);
		computeTablesMock.mockImplementation(() => {
			throw parseError;
		});
		createExampleSchemasMock.mockReturnValue(exampleSchemas);

		// Act
		const result = parseSupabaseTypes(filePath);

		// Assert
		expect(result).toStrictEqual(exampleSchemas);
		expect(createExampleSchemasMock).toHaveBeenCalledTimes(SINGLE_CALL);
		expect(sErrorMock).toHaveBeenCalledTimes(SINGLE_CALL);
		expect(sErrorMock).toHaveBeenCalledWith("❌ Error parsing Supabase types:", parseError);
		expect(sWarnMock).toHaveBeenCalledTimes(SINGLE_CALL);
		expect(sWarnMock).toHaveBeenCalledWith("🔧 Falling back to example schemas...");
	});
});
