import { findConfigFile, type Program } from "typescript";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import createProgramForFile from "./createProgramForFile";
import getProgramSourceFile from "./getProgramSourceFile";
import getTypeContext from "./getTypeContext";

vi.mock("typescript");
vi.mock("./createProgramForFile");
vi.mock("./getProgramSourceFile");

describe("getTypeContext", () => {
	it("returns context when program and sourceFile available", () => {
		// Arrange
		const fakeProgram = forceCast<Program>({ getTypeChecker: () => ({}) });
		vi.mocked(createProgramForFile).mockReturnValue(fakeProgram);
		vi.mocked(getProgramSourceFile).mockReturnValue(forceCast({}));
		vi.mocked(findConfigFile).mockReturnValue(forceCast(undefined));

		// Act
		const result = getTypeContext("/some/file.ts");

		// Assert
		expect(result).toBeDefined();
		expect(result?.program).toBe(fakeProgram);
		expect(result?.checker).toStrictEqual(fakeProgram.getTypeChecker());
	});

	it("returns undefined when getProgramSourceFile returns undefined", () => {
		// Arrange
		vi.mocked(createProgramForFile).mockClear();
		vi.mocked(getProgramSourceFile).mockReturnValue(forceCast(undefined));
		vi.mocked(findConfigFile).mockReturnValue(forceCast(undefined));
		vi.mocked(createProgramForFile).mockReturnValue(
			forceCast<Program>({ getTypeChecker: () => ({}) }),
		);

		// Act
		const result = getTypeContext("/another/file.ts");

		// Assert
		expect(result).toBeUndefined();
	});
});
