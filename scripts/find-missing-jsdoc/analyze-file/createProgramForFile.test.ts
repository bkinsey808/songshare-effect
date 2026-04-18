import path from "node:path";

import {
	createProgram,
	parseJsonConfigFileContent,
	readConfigFile,
	type ParsedCommandLine,
	type Program,
} from "typescript";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import createProgramForFile from "./createProgramForFile";

vi.mock("typescript");

describe("createProgramForFile", () => {
	it("calls createProgram with standalone options when configPath is undefined", () => {
		// Arrange
		const fakeProgram = forceCast<Program>({});
		vi.mocked(createProgram).mockReturnValue(fakeProgram);
		const filePath = "/some/file.ts";

		// Act
		const result = createProgramForFile(filePath, undefined);

		// Assert
		expect(result).toBe(fakeProgram);
		expect(vi.mocked(createProgram)).toHaveBeenCalledWith(expect.any(Object));
		const { calls } = vi.mocked(createProgram).mock;
		const MIN_CALLS = 1;
		expect(calls.length).toBeGreaterThanOrEqual(MIN_CALLS);
		const [firstCall] = calls;
		expect(firstCall).toBeDefined();
		const callArgs = forceCast<unknown[]>(firstCall);
		const [callArg] = callArgs;
		expect(forceCast<Record<string, unknown>>(callArg)["rootNames"]).toStrictEqual([filePath]);
	});

	it("parses tsconfig and calls createProgram with parsed config when configPath provided", () => {
		// Arrange
		const fakeProgram = forceCast<Program>({});
		vi.mocked(createProgram).mockClear();
		vi.mocked(createProgram).mockReturnValue(fakeProgram);
		vi.mocked(readConfigFile).mockReturnValue({ config: { compilerOptions: {} } });
		vi.mocked(parseJsonConfigFileContent).mockReturnValue(
			forceCast<ParsedCommandLine>({
				options: { someOption: 1 },
				fileNames: ["a.ts", "b.ts"],
				errors: [],
			}),
		);

		const filePath = "/some/file.ts";
		const configPath = "/path/tsconfig.json";

		// Act
		const result = createProgramForFile(filePath, configPath);

		// Assert
		expect(result).toBe(fakeProgram);
		expect(vi.mocked(readConfigFile)).toHaveBeenCalledWith(configPath, expect.any(Function));
		expect(vi.mocked(parseJsonConfigFileContent)).toHaveBeenCalledWith(
			expect.any(Object),
			expect.any(Object),
			path.dirname(configPath),
		);
		const calls2 = vi.mocked(createProgram).mock.calls;
		const MIN_CALLS = 1;
		expect(calls2.length).toBeGreaterThanOrEqual(MIN_CALLS);
		const [firstCall2] = calls2;
		const callArgs2 = forceCast<unknown[]>(firstCall2);
		const [callArg2] = callArgs2;
		expect(forceCast<Record<string, unknown>>(callArg2)["options"]).toStrictEqual({
			someOption: 1,
		});
		expect(forceCast<Record<string, unknown>>(callArg2)["rootNames"]).toStrictEqual([
			"a.ts",
			"b.ts",
		]);
	});
});
