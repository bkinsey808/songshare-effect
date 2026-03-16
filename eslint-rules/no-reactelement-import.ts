import type { Rule } from "eslint";

// ESLint rule that prevents two related anti-patterns around `ReactElement`:
// * importing it from the `react` package (it's ambient in this repo)
// * referencing it as the qualified type `ReactElement` (use the
//   unqualified ambient `ReactElement` instead)
//
// Both forms are unnecessary/confusing because the type is provided globally.

const rule: Rule.RuleModule = {
	meta: {
		type: "problem" as const,
		docs: {
			description: "prevent importing ReactElement from 'react'",
			recommended: false,
		},
		schema: [],
	},
	create(context) {
		return {
			ImportDeclaration(node) {
				const source = (node as unknown as { source: { value: string } }).source;
				if (source.value !== "react") {
					return;
				}

				const specifiers = (
					node as unknown as {
						specifiers: {
							type: string;
							imported: { name: string };
						}[];
					}
				).specifiers;

				for (const specifier of specifiers) {
					if (specifier.type === "ImportSpecifier" && specifier.imported.name === "ReactElement") {
						context.report({
							node: specifier as unknown as Rule.Node,
							message: "ReactElement is an ambient import in this project. Do not use JSX.Element.",
						});
					}
				}
			},

			// also forbid usage of the qualified type `ReactElement`
			TSTypeReference(node: Rule.Node) {
				const typeName = (
					node as unknown as {
						typeName: {
							type: string;
							left?: { type: string; name: string };
							right?: { type: string; name: string };
						};
					}
				).typeName;
				if (
					typeName.type === "TSQualifiedName" &&
					typeName.left?.type === "Identifier" &&
					typeName.left.name === "React" &&
					typeName.right?.type === "Identifier" &&
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
