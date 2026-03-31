import { describe, expect, it, vi } from "vitest";

import runFormatterWrite from "./runFormatterWrite";

const { execFileSyncMock, existsSyncMock, extractErrorMessageMock, sWarnMock } = vi.hoisted(() => ({
	execFileSyncMock: vi.fn(),
	existsSyncMock: vi.fn(),
	extractErrorMessageMock: vi.fn(),
	sWarnMock: vi.fn(),
}));

vi.mock(import("node:child_process"), async (importOriginal) => {
	const originalModule = await importOriginal();

	return {
		...originalModule,
		default: {
			...(originalModule.default ?? originalModule),
			execFileSync: execFileSyncMock,
		},
		execFileSync: execFileSyncMock,
	};
});

vi.mock(import("node:fs"), async (importOriginal) => {
	const originalModule = await importOriginal();

	return {
		...originalModule,
		default: {
			...(originalModule.default ?? originalModule),
			existsSync: existsSyncMock,
		},
		existsSync: existsSyncMock,
	};
});

vi.mock(import("@/scripts/utils/scriptLogger"), () => ({
	warn: sWarnMock,
}));

vi.mock(import("@/shared/error-message/extractErrorMessage"), () => ({
	default: extractErrorMessageMock,
}));

const SINGLE_CALL = 1;
const FIRST_FILE_INDEX = 0;
const SECOND_FILE_INDEX = 1;

describe("runFormatterWrite", () => {
	it("does nothing when none of the candidate files exist", () => {
		// Arrange
		const params = {
			projectRoot: "/repo",
			files: ["/repo/shared/src/generated/supabaseSchemas.ts"],
			cliPath: "/repo/node_modules/.bin/oxfmt",
		};

		vi.clearAllMocks();
		existsSyncMock.mockReturnValue(false);

		// Act
		runFormatterWrite(params);

		// Assert
		expect({
			execFileSyncCalls: execFileSyncMock.mock.calls,
			existsSyncCalls: existsSyncMock.mock.calls,
			extractErrorMessageCalls: extractErrorMessageMock.mock.calls,
			sWarnCalls: sWarnMock.mock.calls,
		}).toStrictEqual({
			execFileSyncCalls: [],
			existsSyncCalls: [[params.files[FIRST_FILE_INDEX]]],
			extractErrorMessageCalls: [],
			sWarnCalls: [],
		});
	});

	it("formats only files that exist using project-relative paths", () => {
		// Arrange
		const params = {
			projectRoot: "/repo",
			files: [
				"/repo/shared/src/generated/supabaseSchemas.ts",
				"/repo/shared/src/generated/supabaseTypes.ts",
			],
			cliPath: "/repo/node_modules/.bin/oxfmt",
		};

		vi.clearAllMocks();
		existsSyncMock.mockImplementation(
			(filePath: string) => filePath === params.files[SECOND_FILE_INDEX],
		);

		// Act
		runFormatterWrite(params);

		// Assert
		expect(existsSyncMock).toHaveBeenCalledTimes(params.files.length);
		expect(execFileSyncMock).toHaveBeenCalledTimes(SINGLE_CALL);
		expect(execFileSyncMock).toHaveBeenCalledWith(
			params.cliPath,
			["--write", "--no-error-on-unmatched-pattern", "shared/src/generated/supabaseTypes.ts"],
			{
				cwd: params.projectRoot,
				stdio: "pipe",
			},
		);
		expect(extractErrorMessageMock).not.toHaveBeenCalled();
		expect(sWarnMock).not.toHaveBeenCalled();
	});

	it("logs a warning when the formatter command throws", () => {
		// Arrange
		const params = {
			projectRoot: "/repo",
			files: ["/repo/shared/src/generated/supabaseSchemas.ts"],
			cliPath: "/repo/node_modules/.bin/oxfmt",
		};
		const formatError = new Error("spawn failed");
		const extractedMessage = "Formatter failed";

		vi.clearAllMocks();
		existsSyncMock.mockReturnValue(true);
		execFileSyncMock.mockImplementation(() => {
			throw formatError;
		});
		extractErrorMessageMock.mockReturnValue(extractedMessage);

		// Act
		runFormatterWrite(params);

		// Assert
		expect(execFileSyncMock).toHaveBeenCalledTimes(SINGLE_CALL);
		expect(extractErrorMessageMock).toHaveBeenCalledTimes(SINGLE_CALL);
		expect(extractErrorMessageMock).toHaveBeenCalledWith(formatError, "Unknown error");
		expect(sWarnMock).toHaveBeenCalledTimes(SINGLE_CALL);
		expect(sWarnMock).toHaveBeenCalledWith("⚠️  oxfmt format failed:", extractedMessage);
	});
});
