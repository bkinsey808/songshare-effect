import { describe, expect, it, vi } from "vitest";

import type { TableDefinition } from "./generate-effect-schemas-types";
import generateEffectSchemasFile from "./generateEffectSchemasFile";

const { existsSyncMock, generateEffectSchemaMock, mkdirSyncMock, sWarnMock, writeFileSyncMock } =
	vi.hoisted(() => ({
		existsSyncMock: vi.fn(),
		generateEffectSchemaMock: vi.fn(),
		mkdirSyncMock: vi.fn(),
		sWarnMock: vi.fn(),
		writeFileSyncMock: vi.fn(),
	}));

vi.mock(import("node:fs"), async (importOriginal) => {
	const originalModule = await importOriginal();

	return {
		...originalModule,
		default: {
			...(originalModule.default ?? originalModule),
			existsSync: existsSyncMock,
			mkdirSync: mkdirSyncMock,
			writeFileSync: writeFileSyncMock,
		},
		existsSync: existsSyncMock,
		mkdirSync: mkdirSyncMock,
		writeFileSync: writeFileSyncMock,
	};
});

vi.mock(import("@/scripts/utils/scriptLogger"), () => ({
	warn: sWarnMock,
}));

vi.mock(import("./generateEffectSchema"), () => ({
	default: generateEffectSchemaMock,
}));

const SINGLE_CALL = 1;
const CONTENT_ARGUMENT_INDEX = 1;
const FIRST_FILE_WRITE_CALL = 0;
const FIRST_TABLE_INDEX = 0;
const SECOND_TABLE_INDEX = 1;

const tables: TableDefinition[] = [
	{
		name: "songs",
		columns: [{ name: "title", nullable: false, type: "string" }],
	},
	{
		name: "playlists",
		columns: [{ name: "name", nullable: false, type: "string" }],
	},
];

const singleTable: TableDefinition[] = [
	{
		name: "songs",
		columns: [{ name: "title", nullable: false, type: "string" }],
	},
];

describe("generateEffectSchemasFile", () => {
	it("creates the output directory when needed and writes the generated schemas file", () => {
		// Arrange
		const outputPath = "/repo/shared/src/generated/supabaseSchemas.ts";
		const timestamp = new Date("2026-03-30T22:00:00.000Z");

		vi.clearAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(timestamp);
		existsSyncMock.mockReturnValue(false);
		generateEffectSchemaMock
			.mockReturnValueOnce("// songs schema")
			.mockReturnValueOnce("// playlists schema");

		try {
			// Act
			generateEffectSchemasFile(tables, outputPath);

			// Assert
			expect(generateEffectSchemaMock.mock.calls).toStrictEqual([
				[tables[FIRST_TABLE_INDEX]],
				[tables[SECOND_TABLE_INDEX]],
			]);
			expect({
				existsSyncCalls: existsSyncMock.mock.calls,
				mkdirSyncCalls: mkdirSyncMock.mock.calls,
				sWarnCalls: sWarnMock.mock.calls,
			}).toStrictEqual({
				existsSyncCalls: [["/repo/shared/src/generated"]],
				mkdirSyncCalls: [["/repo/shared/src/generated", { recursive: true }]],
				sWarnCalls: [[`✅ Generated Effect schemas at: ${outputPath}`]],
			});
			expect(writeFileSyncMock).toHaveBeenCalledTimes(SINGLE_CALL);
			expect(writeFileSyncMock.mock.calls[FIRST_FILE_WRITE_CALL]).toStrictEqual([
				outputPath,
				expect.stringContaining("Last generated: 2026-03-30T22:00:00.000Z"),
				"utf8",
			]);
			expect(
				writeFileSyncMock.mock.calls[FIRST_FILE_WRITE_CALL]?.[CONTENT_ARGUMENT_INDEX],
			).toStrictEqual(
				expect.stringContaining("// songs schema\n// playlists schema"),
			);
			expect(
				writeFileSyncMock.mock.calls[FIRST_FILE_WRITE_CALL]?.[CONTENT_ARGUMENT_INDEX],
			).toStrictEqual(
				expect.stringContaining("export const ApiResponseSchema = <A, I, R>("),
			);
		} finally {
			vi.useRealTimers();
		}
	});

	it("skips directory creation when the output directory already exists", () => {
		// Arrange
		const outputPath = "/repo/shared/src/generated/supabaseSchemas.ts";

		vi.clearAllMocks();
		existsSyncMock.mockReturnValue(true);
		generateEffectSchemaMock.mockReturnValue("// songs schema");

		// Act
		generateEffectSchemasFile(singleTable, outputPath);

		// Assert
		expect(mkdirSyncMock).not.toHaveBeenCalled();
		expect(existsSyncMock).toHaveBeenCalledTimes(SINGLE_CALL);
		expect(writeFileSyncMock).toHaveBeenCalledTimes(SINGLE_CALL);
		expect(
			writeFileSyncMock.mock.calls[FIRST_FILE_WRITE_CALL]?.[CONTENT_ARGUMENT_INDEX],
		).toStrictEqual(
			expect.stringContaining("// songs schema"),
		);
	});
});
