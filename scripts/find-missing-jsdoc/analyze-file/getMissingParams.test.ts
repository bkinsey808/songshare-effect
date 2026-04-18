import type { Node, SourceFile, TypeChecker } from "typescript";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import getDocumentedParamNames from "./getDocumentedParamNames";
import getExpectedParamNames from "./getExpectedParamNames";
import getMissingParams from "./getMissingParams";

vi.mock("./getDocumentedParamNames");
vi.mock("./getExpectedParamNames");

describe("getMissingParams", () => {
	it("returns params that are expected but not documented", () => {
		// Arrange
		const node = forceCast<Node>({});
		const sourceFile = forceCast<SourceFile>({});

		vi.mocked(getDocumentedParamNames).mockReturnValue(new Set(["b"]));
		vi.mocked(getExpectedParamNames).mockReturnValue(new Set(["a", "b"]));

		// Act
		const result = getMissingParams(
			node,
			sourceFile,
			forceCast<TypeChecker | undefined>(undefined),
		);

		// Assert
		expect(result).toStrictEqual(["a"]);
	});
});
