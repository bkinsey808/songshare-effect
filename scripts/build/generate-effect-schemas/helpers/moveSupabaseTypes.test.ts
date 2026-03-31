import { describe, expect, it, vi } from "vitest";

import { moveSupabaseTypes } from "./moveSupabaseTypes";

const { existsSyncMock, extractErrorMessageMock, mkdirSyncMock, renameSyncMock, rmSyncMock, sWarnMock } =
	vi.hoisted(() => ({
		existsSyncMock: vi.fn(),
		extractErrorMessageMock: vi.fn(),
		mkdirSyncMock: vi.fn(),
		renameSyncMock: vi.fn(),
		rmSyncMock: vi.fn(),
		sWarnMock: vi.fn(),
	}));

vi.mock(import("node:fs"), async (importOriginal) => {
	const originalModule = await importOriginal();

	return {
		...originalModule,
		default: {
			...(originalModule.default ?? originalModule),
			existsSync: existsSyncMock,
			mkdirSync: mkdirSyncMock,
			renameSync: renameSyncMock,
			rmSync: rmSyncMock,
		},
		existsSync: existsSyncMock,
		mkdirSync: mkdirSyncMock,
		renameSync: renameSyncMock,
		rmSync: rmSyncMock,
	};
});

vi.mock(import("@/scripts/utils/scriptLogger"), () => ({
	warn: sWarnMock,
}));

vi.mock(import("@/shared/error-message/extractErrorMessage"), () => ({
	default: extractErrorMessageMock,
}));

const SINGLE_CALL = 1;
const TWO_CALLS = 2;

describe("moveSupabaseTypes", () => {
	it("returns undefined and warns when types were not generated", () => {
		// Arrange
		const config = {
			tempPath: "/repo/temp-supabase-types.ts",
			destinationPath: "/repo/shared/src/generated/supabaseTypes.ts",
			generated: false,
		};

		vi.clearAllMocks();

		// Act
		const result = moveSupabaseTypes(config);

		// Assert
		expect(result).toBeUndefined();
		expect({
			existsSyncCalls: existsSyncMock.mock.calls,
			extractErrorMessageCalls: extractErrorMessageMock.mock.calls,
			mkdirSyncCalls: mkdirSyncMock.mock.calls,
			renameSyncCalls: renameSyncMock.mock.calls,
			rmSyncCalls: rmSyncMock.mock.calls,
			sWarnCalls: sWarnMock.mock.calls,
		}).toStrictEqual({
			existsSyncCalls: [],
			extractErrorMessageCalls: [],
			mkdirSyncCalls: [],
			renameSyncCalls: [],
			rmSyncCalls: [],
			sWarnCalls: [["📁 No types file to move (using fallback schemas)"]],
		});
	});

	it("creates the destination directory and moves the generated file", () => {
		// Arrange
		const config = {
			tempPath: "/repo/temp-supabase-types.ts",
			destinationPath: "/repo/shared/src/generated/supabaseTypes.ts",
			generated: true,
		};

		vi.clearAllMocks();
		existsSyncMock.mockReturnValue(true);

		// Act
		const result = moveSupabaseTypes(config);

		// Assert
		expect(result).toBe(config.destinationPath);
		expect({
			existsSyncCalls: existsSyncMock.mock.calls,
			mkdirSyncCalls: mkdirSyncMock.mock.calls,
			renameSyncCalls: renameSyncMock.mock.calls,
			rmSyncCalls: rmSyncMock.mock.calls,
			sWarnCalls: sWarnMock.mock.calls,
		}).toStrictEqual({
			existsSyncCalls: [[config.tempPath]],
			mkdirSyncCalls: [["/repo/shared/src/generated", { recursive: true }]],
			renameSyncCalls: [[config.tempPath, config.destinationPath]],
			rmSyncCalls: [],
			sWarnCalls: [["📁 Moving Supabase types to shared/src/generated directory..."]],
		});
	});

	it("warns and removes the temp file when moving fails and the temp file still exists", () => {
		// Arrange
		const config = {
			tempPath: "/repo/temp-supabase-types.ts",
			destinationPath: "/repo/shared/src/generated/supabaseTypes.ts",
			generated: true,
		};
		const moveError = new Error("rename failed");
		const extractedMessage = "Rename failed";

		vi.clearAllMocks();
		existsSyncMock.mockReturnValue(true);
		renameSyncMock.mockImplementation(() => {
			throw moveError;
		});
		extractErrorMessageMock.mockReturnValue(extractedMessage);

		// Act
		const result = moveSupabaseTypes(config);

		// Assert
		expect(result).toBeUndefined();
		expect(extractErrorMessageMock).toHaveBeenCalledTimes(SINGLE_CALL);
		expect(extractErrorMessageMock).toHaveBeenCalledWith(moveError, "Unknown error");
		expect(rmSyncMock).toHaveBeenCalledTimes(SINGLE_CALL);
		expect(rmSyncMock).toHaveBeenCalledWith(config.tempPath);
		expect(sWarnMock.mock.calls).toStrictEqual([
			["📁 Moving Supabase types to shared/src/generated directory..."],
			["Warning: could not move Supabase types:", extractedMessage],
		]);
	});

	it("warns without deleting when moving fails and the temp file no longer exists", () => {
		// Arrange
		const config = {
			tempPath: "/repo/temp-supabase-types.ts",
			destinationPath: "/repo/shared/src/generated/supabaseTypes.ts",
			generated: true,
		};
		const moveError = new Error("rename failed");
		const extractedMessage = "Rename failed";

		vi.clearAllMocks();
		existsSyncMock
			.mockReturnValueOnce(true)
			.mockReturnValueOnce(false);
		renameSyncMock.mockImplementation(() => {
			throw moveError;
		});
		extractErrorMessageMock.mockReturnValue(extractedMessage);

		// Act
		const result = moveSupabaseTypes(config);

		// Assert
		expect(result).toBeUndefined();
		expect(existsSyncMock).toHaveBeenCalledTimes(TWO_CALLS);
		expect(rmSyncMock).not.toHaveBeenCalled();
		expect(sWarnMock.mock.calls).toStrictEqual([
			["📁 Moving Supabase types to shared/src/generated directory..."],
			["Warning: could not move Supabase types:", extractedMessage],
		]);
	});
});
