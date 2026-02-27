// ESLint rule that forbids any `oxlint-disable` or `oxlint-disable` comment
// from appearing inside the body of a `describe`, `test`, or `it` block.  If a
// disable is absolutely necessary it should live in a separate helper function
// so tests themselves stay clean.  Exported as ESM so it can be loaded in a
// `type:module` project.

const rule = {
	meta: {
		type: "problem",
		docs: {
			description:
				"disallow lint-disable comments inside describe/test/it blocks; place them in helpers",
			recommended: false,
		},
		schema: [],
	},
	create(context) {
		const sourceCode = context.getSourceCode();
		const commentsInTests = new Set();
		const allFunctions = [];

		function containsDisable(text) {
			return /(?:eslint|oxlint)-disable/.test(text);
		}

		function isInsideTest(node) {
			let parent = node.parent;
			while (parent) {
				if (parent.type === "CallExpression") {
					let name = null;
					const { callee } = parent;
					if (callee.type === "Identifier") {
						name = callee.name;
					} else if (callee.type === "MemberExpression" && callee.property?.type === "Identifier") {
						name = callee.property.name;
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
				const commentsInHelpers = new Set();

				for (const fn of allFunctions) {
					const isTest = isInsideTest(fn);
					const comments = sourceCode.getCommentsInside(fn.body);
					for (const comment of comments) {
						if (containsDisable(comment.value)) {
							if (isTest) {
								commentsInTests.add(comment);
								context.report({
									node: comment,
									message:
										"Avoid lint-disable comments inside test blocks; move them to a helper function.",
								});
							} else {
								commentsInHelpers.add(comment);
							}
						}
					}
				}

				for (const comment of allComments) {
					if (!containsDisable(comment.value)) continue;
					if (commentsInTests.has(comment)) continue;
					if (commentsInHelpers.has(comment)) continue;

					// also check if it's immediately above a helper
					const nextBody = programNode.body.find(
						(n) => n.loc && n.loc.start.line === comment.loc.end.line + 1,
					);
					const isHelper =
						nextBody &&
						(nextBody.type === "FunctionDeclaration" ||
							nextBody.type === "VariableDeclaration" ||
							(nextBody.type === "ExpressionStatement" &&
								nextBody.expression.type === "CallExpression" &&
								(nextBody.expression.callee.name === "vi.mock" ||
									(nextBody.expression.callee.type === "MemberExpression" &&
										nextBody.expression.callee.object.name === "vi" &&
										nextBody.expression.callee.property.name === "mock"))));
					if (isHelper) {
						continue;
					}

					context.report({
						node: comment,
						message:
							"Avoid lint-disable comments inside test files; move them to a helper function or remove them.",
					});
				}
			},
		};
	},
};

export default rule;
