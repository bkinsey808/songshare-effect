import {
    getJSDocTags,
    isJSDocParameterTag,
    type JSDocTag,
    type Node,
    type SourceFile,
} from "typescript";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import getDocumentedParamNames from "./getDocumentedParamNames";

vi.mock("typescript");

describe("getDocumentedParamNames", () => {
	it("returns a set of documented param names", () => {
		// Arrange
		vi.mocked(getJSDocTags).mockReturnValue(
			forceCast<JSDocTag[]>([{ name: { getText: (): string => "param1" } }]),
		);
		vi.mocked(isJSDocParameterTag).mockReturnValue(true);

		const fakeNode = forceCast<Node>({});
		const fakeSourceFile = forceCast<SourceFile>({});

		// Act
		const result = getDocumentedParamNames(fakeNode, fakeSourceFile);

		// Assert
		expect(result.has("param1")).toBe(true);
		const ONE = 1;
		expect(result.size).toBe(ONE);
	});
});
