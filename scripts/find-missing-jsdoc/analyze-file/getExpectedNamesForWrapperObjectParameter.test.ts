import { isIdentifier, type TypeChecker, type ParameterDeclaration } from "typescript";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import getExpectedNamesForWrapperObjectParameter from "./getExpectedNamesForWrapperObjectParameter";
import getObjectPropertyNames from "./getObjectPropertyNames";

vi.mock("typescript");
vi.mock("./getObjectPropertyNames");
vi.mocked(isIdentifier).mockReturnValue(true);

describe("getExpectedNamesForWrapperObjectParameter", () => {
	it("returns property names when parameter is identifier and in wrapper list", () => {
		// Arrange
		const parameter = forceCast<ParameterDeclaration>({
			name: { text: "props" },
			dotDotDotToken: undefined,
		});
		const documented = new Set<string>();
		vi.mocked(getObjectPropertyNames).mockReturnValue(["a", "b", "c"]);

		// Act
		const result = getExpectedNamesForWrapperObjectParameter(
			parameter,
			documented,
			forceCast<TypeChecker>({}),
		);

		// Assert
		expect(result).toStrictEqual(["a", "b", "c"]);
	});

	it("returns empty when parameter is not identifier", () => {
		// Arrange
		const parameter = forceCast<ParameterDeclaration>({ name: { kind: "Pattern" } });
		const documented = new Set<string>();

		// Act
		const result = getExpectedNamesForWrapperObjectParameter(
			parameter,
			documented,
			forceCast<TypeChecker>({}),
		);

		// Assert
		expect(result).toStrictEqual([]);
	});
});
