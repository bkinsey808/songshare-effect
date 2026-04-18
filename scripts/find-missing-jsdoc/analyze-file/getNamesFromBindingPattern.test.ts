import {
	isBindingElement,
	isIdentifier,
	isObjectBindingPattern,
	isStringLiteral,
	type Node,
} from "typescript";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import getNamesFromBindingPattern from "./getNamesFromBindingPattern";

vi.mock("typescript");

describe("getNamesFromBindingPattern", () => {
	it("extracts identifier and string literal names from a pattern", () => {
		// Arrange
		vi.mocked(isObjectBindingPattern).mockReturnValue(true);
		vi.mocked(isBindingElement).mockReturnValue(true);
		vi.mocked(isIdentifier).mockReturnValue(true);
		vi.mocked(isStringLiteral).mockReturnValue(true);

		const name = forceCast<Node>({
			__isPattern: true,
			elements: [
				{ propertyName: { text: "foo" } },
				{ name: { text: "bar" } },
				{ propertyName: { text: "baz" } },
			],
		});

		// Act
		const result = getNamesFromBindingPattern(name);

		// Assert
		expect(result).toContain("foo");
		expect(result).toContain("bar");
		expect(result).toContain("baz");
	});
});
