import { getJSDocTags, type Node, type SourceFile } from "typescript";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import hasAnyJsDoc from "./hasAnyJsDoc";

vi.mock("typescript");

describe("hasAnyJsDoc", () => {
	it("returns true when JSDoc comment exists before node", () => {
		// Arrange
		vi.mocked(getJSDocTags).mockReturnValue([]);
		const sourceFile = forceCast<SourceFile>({
			getFullText: () => "/* unrelated */\n/**\n * comment\n */\nfunction f() {}",
		});
		const node = forceCast<Node>({ getStart: () => sourceFile.getFullText().indexOf("function") });

		// Act
		const result = hasAnyJsDoc(node, sourceFile);

		// Assert
		expect(result).toBe(true);
	});

	it("returns false when no JSDoc exists", () => {
		// Arrange
		vi.mocked(getJSDocTags).mockReturnValue([]);
		const sourceFile = forceCast<SourceFile>({ getFullText: () => "const x = 1; function f() {}" });
		const node = forceCast<Node>({ getStart: () => sourceFile.getFullText().indexOf("function") });

		// Act
		const result = hasAnyJsDoc(node, sourceFile);

		// Assert
		expect(result).toBe(false);
	});
});
