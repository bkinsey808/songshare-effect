import type { Rule } from "eslint";

/**
 * ESLint rule to flag empty `// Arrange` comments.
 *
 * A `// Arrange` comment is considered empty when there are no non-comment
 * statements between the comment and the next `// Act`/`// Assert` comment or
 * until the end of the enclosing block/file.
 */

const rule: Rule.RuleModule = {
	meta: {
		type: "problem",
		docs: {
			description: "disallow empty `// Arrange` comments",
			recommended: false,
		},
		schema: [],
		messages: {
			emptyArrange: "Remove empty `// Arrange` or add setup statements before it.",
		},
	},

	create(context) {
		const sourceCode = (
			context as unknown as { sourceCode: { text: string; getAllComments(): any[] } }
		).sourceCode;
		const text = sourceCode.text;
		const lines = text.split(/\r?\n/);

		return {
			Program() {
				const comments = sourceCode.getAllComments();
				for (const c of comments) {
					if (c.type !== "Line") continue;
					// Accept `// Arrange` or `// Arrange - note` (allow trailing text)
					if (!/^[\s]*Arrange\b/.test(c.value)) continue;

					// (No special-case exemptions; treat Arrange uniformly across tests.)

					// start checking from the next line after the comment
					const startLine = c.loc!.end.line + 1;
					let foundNonCommentCode = false;
					for (let i = startLine; i <= lines.length; i++) {
						const raw = lines[i - 1] ?? "";
						const trimmed = raw.trim();
						if (trimmed === "") continue; // blank line

						// treat line comments and block comment markers as comments
						if (trimmed.startsWith("//")) {
							const after = trimmed.replace(/^\/\/\s*/, "");
							const tag = after.split(/[\s:]/, 1)[0];
							if (tag === "Act" || tag === "Assert") {
								// next structural marker arrived; no setup found
								break;
							}
							// other comment line; keep scanning
							continue;
						}
						if (trimmed.startsWith("/*") || trimmed.startsWith("*")) {
							// block-comment content; treat as comment and continue
							continue;
						}

						// found non-comment/non-empty content — Arrange is not empty
						foundNonCommentCode = true;
						break;
					}

					if (!foundNonCommentCode) {
						context.report({
							loc: c.loc,
							messageId: "emptyArrange",
						});
					}
				}
			},
		};
	},
};

export default rule;
