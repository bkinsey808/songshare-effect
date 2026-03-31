import { describe, expect, it } from "vitest";

import getTypeAnnotation from "./getTypeAnnotation";

describe("getTypeAnnotation", () => {
	it("returns a typeof annotation for non-wrapper schema expressions", () => {
		// Arrange
		const effectType = "Schema.String";

		// Act
		const result = getTypeAnnotation(effectType);

		// Assert
		expect(result).toBe("typeof Schema.String");
	});

	it("converts array schema expressions into Schema.Array$ annotations", () => {
		// Arrange
		const effectType = "Schema.Array(Schema.Number)";

		// Act
		const result = getTypeAnnotation(effectType);

		// Assert
		expect(result).toBe("Schema.Array$<typeof Schema.Number>");
	});

	it("converts optional schema expressions into Schema.optional annotations", () => {
		// Arrange
		const effectType = "Schema.optional(Schema.Boolean)";

		// Act
		const result = getTypeAnnotation(effectType);

		// Assert
		expect(result).toBe("Schema.optional<typeof Schema.Boolean>");
	});

	it("converts literal schema expressions into tuple-based literal annotations", () => {
		// Arrange
		const effectType = 'Schema.Literal("show", "hide")';

		// Act
		const result = getTypeAnnotation(effectType);

		// Assert
		expect(result).toBe('Schema.Literal<["show", "hide"]>');
	});

	it("recursively converts nested wrapper schema expressions", () => {
		// Arrange
		const effectType = 'Schema.optional(Schema.Array(Schema.Literal("draft", "published")))';

		// Act
		const result = getTypeAnnotation(effectType);

		// Assert
		expect(result).toBe(
			'Schema.optional<Schema.Array$<Schema.Literal<["draft", "published"]>>>',
		);
	});
});
