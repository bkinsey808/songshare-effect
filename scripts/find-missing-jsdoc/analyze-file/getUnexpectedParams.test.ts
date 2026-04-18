import {
	isArrowFunction,
	isFunctionDeclaration,
	isMethodDeclaration,
	type Node,
	type SourceFile,
	type TypeChecker,
} from "typescript";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import getDocumentedParamNames from "./getDocumentedParamNames";
import getExpectedParamNames from "./getExpectedParamNames";
import getUnexpectedParams from "./getUnexpectedParams";

vi.mock("typescript");
vi.mock("./getDocumentedParamNames");
vi.mock("./getExpectedParamNames");

describe("getUnexpectedParams", () => {
	it("filters out allowed documented names and returns unexpected ones", () => {
		// Arrange
		const node = forceCast<Node>({ parameters: [{ name: { text: "props" } }] });
		const sourceFile = forceCast<SourceFile>({});
		const checker = forceCast<TypeChecker>({});

		vi.mocked(isFunctionDeclaration).mockReturnValue(true);
		vi.mocked(isMethodDeclaration).mockReturnValue(false);
		vi.mocked(isArrowFunction).mockReturnValue(false);

		vi.mocked(getDocumentedParamNames).mockReturnValue(new Set(["foo", "props.className", "bar"]));
		vi.mocked(getExpectedParamNames).mockReturnValue(new Set(["className"]));

		// Act
		const result = getUnexpectedParams(node, sourceFile, checker);

		// Assert
		// 'foo' and 'bar' are unexpected; 'props.className' is allowed because className expected
		expect(result).toStrictEqual(["bar", "foo"].toSorted());
	});

	it("allows documenting the parameter name itself unless it's a wrapper name", () => {
		// Arrange
		const node = forceCast<Node>({ parameters: [{ name: { text: "notWrapper" } }] });
		const sourceFile = forceCast<SourceFile>({});

		vi.mocked(isFunctionDeclaration).mockReturnValue(true);
		vi.mocked(isMethodDeclaration).mockReturnValue(false);
		vi.mocked(isArrowFunction).mockReturnValue(false);

		vi.mocked(getDocumentedParamNames).mockReturnValue(new Set(["notWrapper"]));
		vi.mocked(getExpectedParamNames).mockReturnValue(new Set());

		// Act
		const result = getUnexpectedParams(
			node,
			sourceFile,
			forceCast<TypeChecker | undefined>(undefined),
		);

		// Assert
		expect(result).toStrictEqual(["notWrapper"]);
	});
});
