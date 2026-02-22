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

		function containsDisable(text) {
			return /(?:eslint|oxlint)-disable/.test(text);
		}

		// record any offending comments found inside the bodies of describe/test/it
		// callbacks so that we don't double-report them during the Program check.
		function checkFunction(fn) {
			if (!fn.body) return;
			const comments = sourceCode.getCommentsInside(fn.body);
			for (const comment of comments) {
				if (containsDisable(comment.value)) {
					commentsInTests.add(comment);
					context.report({
						node: comment,
						message:
							"Avoid lint-disable comments inside test blocks; move them to a helper function.",
					});
				}
			}
		}

		return {
			CallExpression(node) {
				let name = null;
				const { callee } = node;
				if (callee.type === "Identifier") {
					name = callee.name;
				} else if (callee.type === "MemberExpression" && callee.property?.type === "Identifier") {
					// e.g. describe.only, test.skip
					name = callee.property.name;
				}

				if (name === "describe" || name === "test" || name === "it") {
					const [, secondArg] = node.arguments;
					if (
						secondArg &&
						(secondArg.type === "FunctionExpression" ||
							secondArg.type === "ArrowFunctionExpression")
					) {
						checkFunction(secondArg);
					}
				}
			},

			Program(node) {
				// flag any remaining disable comments that weren't already caught inside
				// test blocks.  This captures module-level disables (outside of any
				// describe/test/it).  We allow a comment if it sits immediately above a
				// helper function/variable declaration, since disables belong there if
				// they're truly necessary.
				const allComments = sourceCode.getAllComments();
				for (const comment of allComments) {
					if (!containsDisable(comment.value)) continue;
					if (commentsInTests.has(comment)) continue;

					// look for a body node that starts on the line immediately after the
					// comment; if it's a FunctionDeclaration or VariableDeclaration we
					// treat it as a helper and permit the disable there.
					const nextBody = node.body.find(
						(n) => n.loc && n.loc.start.line === comment.loc.end.line + 1,
					);
					const isHelper =
						nextBody &&
						(nextBody.type === "FunctionDeclaration" || nextBody.type === "VariableDeclaration");
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
