import { getJSDocTags, type Node, type JSDocTag } from "typescript";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import hasReturnsTag from "./hasReturnsTag";

vi.mock("typescript");

describe("hasReturnsTag", () => {
	it("detects @returns tag", () => {
		// Arrange
		vi.mocked(getJSDocTags).mockReturnValue(
			forceCast<JSDocTag[]>([{ tagName: { text: "returns" } }]),
		);
		const node = forceCast<Node>({});

		// Act
		const result = hasReturnsTag(node);

		// Assert
		expect(result).toBe(true);
	});
});
