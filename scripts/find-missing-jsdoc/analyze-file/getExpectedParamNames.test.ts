import {
	isArrowFunction,
	isFunctionDeclaration,
	isIdentifier,
	isMethodDeclaration,
	isObjectBindingPattern,
	type Node,
	type SourceFile,
} from "typescript";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import getDocumentedParamNames from "./getDocumentedParamNames";
import getExpectedNamesForWrapperObjectParameter from "./getExpectedNamesForWrapperObjectParameter";
import getExpectedParamNames from "./getExpectedParamNames";

vi.mock("typescript");
vi.mock("./getDocumentedParamNames");
vi.mock("./getExpectedNamesForWrapperObjectParameter");
describe("getExpectedParamNames", () => {
	it("returns identifier param names when function node provided", () => {
		// Arrange
		vi.mocked(isFunctionDeclaration).mockReturnValue(true);
		vi.mocked(isMethodDeclaration).mockReturnValue(false);
		vi.mocked(isArrowFunction).mockReturnValue(false);
		vi.mocked(isObjectBindingPattern).mockReturnValue(false);
		vi.mocked(isIdentifier).mockReturnValue(true);

		const node = forceCast<Node>({
			parameters: [{ name: { text: "one" } }, { name: { text: "two" } }],
		});
		const sourceFile = forceCast<SourceFile>({});

		vi.mocked(getDocumentedParamNames).mockReturnValue(new Set<string>());
		vi.mocked(getExpectedNamesForWrapperObjectParameter).mockReturnValue([]);

		// Act
		const result = getExpectedParamNames({
			node,
			sourceFile,
			checker: forceCast(undefined),
		});
		// Assert
		expect(result.has("one")).toBe(true);
		expect(result.has("two")).toBe(true);
	});
});
