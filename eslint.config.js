/*
 * This configuration is **only** used for the lightweight custom-ESLint
 * invocation that enforces a small set of project-specific rules (currently
 * just the `require-useeffect-comment` rule).  The primary linter for the
 * repository is **oxlint**, which runs separately and provides the comprehensive
 * rule set used by CI and local development.
 *
 * When running `npm run lint` the `lint` script executes both a custom ESLint
 * pass (powered by this file) and the normal `oxlint` command.  The custom
 * pass is intentionally minimal so that we can add bespoke rules without
 * having to upgrade or fork oxlint itself.
 */

import tsParser from "@typescript-eslint/parser";

import noDisableInTestsRule from "./eslint-rules/no-disable-in-tests.mjs";
import noReactElementRule from "./eslint-rules/no-reactelement-import.mjs";
import useeffectRule from "./eslint-rules/require-useeffect-comment.mjs";

const config = [
	// base config for all files (use TS parser so `eslint .` works globally)
	{
		ignores: [
			"node_modules/**",
			"eslint-rules/**",
			"tmp/**",
			"dist/**",
			"coverage/**",
			"api/dist/**",
			"api/.wrangler/**",
			"**/.wrangler/**",
			"*.mjs",
		],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: "module",
				project: ["./tsconfig.json", "./react/tsconfig.json"],
			},
		},
		rules: {
			// disable rules that require plugins not loaded here; oxlint handles them
			"import/no-unassigned-import": "off",
			"jest/no-hooks": "off",
		},
	},
	// apply our custom rule to TSX/TS/JS files
	{
		files: ["react/**/*.{ts,tsx,js,jsx}", "tmp/**/*.{js,jsx,ts,tsx}"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: "module",
				project: ["./tsconfig.json", "./react/tsconfig.json"],
			},
		},
		plugins: {
			"require-useeffect-comment": {
				rules: {
					"require-useeffect-comment": useeffectRule,
				},
			},
			"no-reactelement-import": {
				rules: {
					"no-reactelement-import": noReactElementRule,
				},
			},
		},
		rules: {
			"require-useeffect-comment/require-useeffect-comment": "error",
			"no-reactelement-import/no-reactelement-import": "error",
		},
	},
	// additional override: only apply no-disable-in-tests rule inside test files
	{
		files: ["**/*.test.ts", "**/*.test.tsx"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: "module",
				project: ["./tsconfig.json", "./react/tsconfig.json"],
			},
		},
		plugins: {
			"no-disable-in-tests": {
				rules: {
					"no-disable-in-tests": noDisableInTestsRule,
				},
			},
		},
		rules: {
			"no-disable-in-tests/no-disable-in-tests": "error",
		},
	},
];

export default config;
