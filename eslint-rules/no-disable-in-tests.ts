import type { Rule } from "eslint";

// ESLint rule that forbids any `eslint-disable` or `oxlint-disable` comment
// from appearing inside the body of a `describe`, `test`, or `it` block.  If a
// disable is absolutely necessary it should live in a separate helper function
// so tests themselves stay clean.

function containsDisable(text: string): boolean {
	return /(?:eslint|oxlint)-disable/.test(text);
}

const rule: Rule.RuleModule = {
	meta: {
		type: "problem" as const,
		docs: {
			description:
				"disallow lint-disable comments inside describe/test/it blocks; place them in helpers",
			recommended: false,
		},
		schema: [],
	},
	create(context) {
		const sourceCode = context.sourceCode;
		const commentsInTests = new Set<Rule.Node>();
		const allFunctions: Rule.Node[] = [];

		function isInsideTest(node: Rule.Node): boolean {
			let parent = node.parent;
			while (parent) {
				if (parent.type === "CallExpression") {
					let name: string | null = null;
					const callee = (parent as unknown as { callee: Rule.Node }).callee;
					if (callee.type === "Identifier") {
						name = (callee as unknown as { name: string }).name;
					} else if (
						callee.type === "MemberExpression" &&
						(callee as unknown as { property?: { type: string; name: string } }).property
							?.type === "Identifier"
					) {
						name =
							(callee as unknown as { property: { name: string } }).property.name;
					}
					if (name === "describe" || name === "test" || name === "it") {
						return true;
					}
				}
				parent = parent.parent;
			}
			return false;
		}

		return {
			FunctionDeclaration: (node) => allFunctions.push(node),
			FunctionExpression: (node) => allFunctions.push(node),
			ArrowFunctionExpression: (node) => allFunctions.push(node),

			"Program:exit"(programNode) {
				const allComments = sourceCode.getAllComments();
				const commentsInHelpers = new Set<Rule.Node>();

				for (const fn of allFunctions) {
					const isTest = isInsideTest(fn);
					const body = (fn as unknown as { body: Rule.Node }).body;
					const comments = sourceCode.getCommentsInside(body);
					for (const comment of comments) {
						if (containsDisable(comment.value)) {
							if (isTest) {
								commentsInTests.add(comment as unknown as Rule.Node);
								context.report({
									node: comment as unknown as Rule.Node,
									message:
										"Avoid lint-disable comments inside test blocks; move them to a helper function.",
								});
							} else {
								commentsInHelpers.add(comment as unknown as Rule.Node);
							}
						}
					}
				}

				for (const comment of allComments) {
					if (!containsDisable(comment.value)) continue;
					if (commentsInTests.has(comment as unknown as Rule.Node)) continue;
					if (commentsInHelpers.has(comment as unknown as Rule.Node)) continue;

					const body = (programNode as unknown as { body: Rule.Node[] }).body;
					const nextBody = body.find(
						(n) =>
							(n as unknown as { loc?: { start: { line: number } } }).loc &&
							(n as unknown as { loc: { start: { line: number } } }).loc.start.line ===
								comment.loc!.end.line + 1,
					);
					const isHelper =
						nextBody != null &&
						(nextBody.type === "FunctionDeclaration" ||
							nextBody.type === "VariableDeclaration" ||
							(nextBody.type === "ExpressionStatement" &&
								(nextBody as unknown as { expression: { type: string; callee: { name?: string; type: string; object?: { name: string }; property?: { name: string } } } }).expression
									.type === "CallExpression" &&
								((nextBody as unknown as { expression: { callee: { name?: string } } })
									.expression.callee.name === "vi.mock" ||
									((nextBody as unknown as {
										expression: {
											callee: {
												type: string;
												object?: { name: string };
												property?: { name: string };
											};
										};
									}).expression.callee.type === "MemberExpression" &&
										(nextBody as unknown as {
											expression: {
												callee: { object: { name: string }; property: { name: string } };
											};
										}).expression.callee.object.name === "vi" &&
										(nextBody as unknown as {
											expression: {
												callee: { object: { name: string }; property: { name: string } };
											};
										}).expression.callee.property.name === "mock"))));
					if (isHelper) {
						continue;
					}

					context.report({
						node: comment as unknown as Rule.Node,
						message:
							"Avoid lint-disable comments inside test files; move them to a helper function or remove them.",
					});
				}
			},
		};
	},
};

export default rule;
