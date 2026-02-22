// ESLint rule that prevents two related anti-patterns around `ReactElement`:
// * importing it from the `react` package (it's ambient in this repo)
// * referencing it as the qualified type `React.ReactElement` (use the
//   unqualified ambient `ReactElement` instead)
//
// Both forms are unnecessary/confusing because the type is provided globally.
//
// Exported as ESM so it can be loaded in a `type:module` project.

const rule = {
	meta: {
		type: "problem",
		docs: {
			description: "prevent importing ReactElement from 'react'",
			recommended: false,
		},
		schema: [],
	},
	create(context) {
		return {
			ImportDeclaration(node) {
				if (node.source.value !== "react") {
					return;
				}

				for (const specifier of node.specifiers) {
					if (specifier.type === "ImportSpecifier" && specifier.imported.name === "ReactElement") {
						context.report({
							node: specifier,
							message: "ReactElement is an ambient import in this project. Do not use JSX.Element.",
						});
					}
				}
			},

			// also forbid usage of the qualified type `React.ReactElement`
			TSTypeReference(node) {
				const { typeName } = node;
				if (
					typeName.type === "TSQualifiedName" &&
					typeName.left.type === "Identifier" &&
					typeName.left.name === "React" &&
					typeName.right.type === "Identifier" &&
					typeName.right.name === "ReactElement"
				) {
					context.report({
						node,
						message: "This project uses ReactElement as an ambient type. Do not use JSX.Element.",
					});
				}
			},
		};
	},
};

export default rule;
