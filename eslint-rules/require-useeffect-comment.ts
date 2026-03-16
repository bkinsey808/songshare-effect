import type { Rule } from "eslint";

// ESLint rule that requires a `//` comment immediately above each useEffect call.

const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion" as const,
		docs: {
			description: "require a line comment directly above every useEffect call",
			recommended: false,
		},
		schema: [],
	},
	create(context) {
		const sourceCode = context.sourceCode;

		return {
			CallExpression(node) {
				let isUseEffect = false;
				const callee = (node as unknown as { callee: Rule.Node }).callee;
				if (
					callee.type === "Identifier" &&
					(callee as unknown as { name: string }).name === "useEffect"
				) {
					isUseEffect = true;
				} else if (
					callee.type === "MemberExpression" &&
					(callee as unknown as { property?: { type: string; name: string } }).property?.type ===
						"Identifier" &&
					(callee as unknown as { property: { name: string } }).property.name === "useEffect"
				) {
					isUseEffect = true;
				}
				if (!isUseEffect) {
					return;
				}

				const commentsBefore = sourceCode.getCommentsBefore(node);
				if (commentsBefore.length === 0) {
					context.report({
						node,
						message: "useEffect call must be preceded by a comment explaining its purpose.",
					});
					return;
				}

				const lastComment = commentsBefore.at(-1);
				const effectLine = node.loc!.start.line;
				const commentEndLine = lastComment!.loc!.end.line;
				if (commentEndLine !== effectLine - 1) {
					context.report({
						node,
						message: "Comment for useEffect should be on the line immediately above the call.",
					});
				}
			},
		};
	},
};

export default rule;
