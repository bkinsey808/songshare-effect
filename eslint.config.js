import cspellPlugin from "@cspell/eslint-plugin";
import js from "@eslint/js";
import shopifyPlugin from "@shopify/eslint-plugin";
import shopifyTsConfig from "@shopify/eslint-plugin/lib/config/typescript.js";
import boundariesPlugin from "eslint-plugin-boundaries";
import eslintCommentsPlugin from "eslint-plugin-eslint-comments";
import importPlugin from "eslint-plugin-import";
import importXPlugin from "eslint-plugin-import-x";
import jsdocPlugin from "eslint-plugin-jsdoc";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import prettierPlugin from "eslint-plugin-prettier";
import promisePlugin from "eslint-plugin-promise";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactRefreshPlugin from "eslint-plugin-react-refresh";
import securityPlugin from "eslint-plugin-security";
import sonarjsPlugin from "eslint-plugin-sonarjs";
import storybookPlugin from "eslint-plugin-storybook";
import unicornPlugin from "eslint-plugin-unicorn";
import globals from "globals";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

const __dirname = dirname(fileURLToPath(import.meta.url));

const sharedPlugins = {
	"import-x": importXPlugin,
	"@typescript-eslint": tseslint.plugin,
	import: importPlugin,
	boundaries: boundariesPlugin,
	security: securityPlugin,
	unicorn: unicornPlugin,
	promise: promisePlugin,
	prettier: prettierPlugin,
	cspell: cspellPlugin,
	jsdoc: jsdocPlugin,
	sonarjs: sonarjsPlugin,
	shopify: shopifyPlugin,
	"@shopify": shopifyPlugin,
	"eslint-comments": eslintCommentsPlugin,
};

const sharedRules = {
	// Shopify strict rules (from typescript config)
	...(Array.isArray(shopifyTsConfig) ? shopifyTsConfig : []).reduce(
		(acc, cfg) => ({
			...acc,
			...(cfg.rules || {}),
		}),
		{},
	),

	// Disable @shopify/binary-assignment-parens rule
	"@shopify/binary-assignment-parens": "off",

	// import-x rules
	"import-x/order": "off",
	"import-x/no-extraneous-dependencies": "off",

	// boundaries rules
	"boundaries/element-types": [
		"error",
		{
			default: "disallow",
			rules: [
				{ from: "api", allow: ["shared"] },
				{ from: "react", allow: ["shared"] },
				{ from: "shared", allow: [] },
			],
		},
	],

	// TypeScript ESLint rules
	...tseslint.configs.strictTypeChecked.rules,
	"@typescript-eslint/consistent-type-imports": [
		"error",
		{ prefer: "type-imports" },
	],
	"@typescript-eslint/strict-boolean-expressions": "error",
	"@typescript-eslint/no-floating-promises": "error",
	"@typescript-eslint/explicit-function-return-type": [
		"error",
		{ allowExpressions: true },
	],
	"@typescript-eslint/consistent-type-definitions": ["error", "type"],
	"@typescript-eslint/no-unused-vars": [
		"warn",
		{
			argsIgnorePattern: "^_",
			varsIgnorePattern: "^_",
			caughtErrorsIgnorePattern: "^_",
		},
	],
	"@typescript-eslint/no-unsafe-assignment": "error",
	"@typescript-eslint/no-explicit-any": "error",
	"@typescript-eslint/no-dynamic-delete": "error",
	// Allow snake_case for property names
	"@typescript-eslint/naming-convention": ["off"],
	"@typescript-eslint/no-non-null-assertion": "error",

	// Import rules
	"import/no-named-as-default": "error",
	"import/newline-after-import": ["error", { count: 1 }],

	// SonarJS rules
	...sonarjsPlugin.configs.recommended.rules,
	"sonarjs/function-return-type": "off",
	"sonarjs/no-use-of-void": "off",
	"sonarjs/void-use": "off",

	// Security rules
	"security/detect-object-injection": "error",
	"security/detect-non-literal-regexp": "error",
	"security/detect-non-literal-fs-filename": "off",
	"security/detect-eval-with-expression": "error",
	"security/detect-unsafe-regex": "warn",

	// Unicorn rules
	"unicorn/consistent-function-scoping": "off",
	"unicorn/no-null": "error",
	"unicorn/no-array-callback-reference": "error",
	"unicorn/throw-new-error": "error",

	// JSDoc rules
	"jsdoc/check-alignment": "warn",
	"jsdoc/check-indentation": "off",
	"jsdoc/check-param-names": "warn",
	"jsdoc/check-tag-names": "warn",
	"jsdoc/check-types": "warn",
	"jsdoc/require-jsdoc": "off",
	"jsdoc/require-param": "off",
	"jsdoc/require-returns": "off",
	"jsdoc/require-description": "warn",

	// Promise rules
	"promise/always-return": "error",
	"promise/catch-or-return": "error",
	"promise/no-return-wrap": "error",

	// Prettier rules
	"prettier/prettier": "warn",

	"cspell/spellchecker": [
		"warn",
		{
			checkComments: true,
			checkIdentifiers: true,
			checkJSXText: true,
			checkStringTemplates: true,
			checkStrings: true,
			generateSuggestions: true,
			ignoreImportProperties: true,
			ignoreImports: true,
			numSuggestions: 5,
		},
	],

	// Core ESLint rules
	"dot-notation": "off",
	"logical-assignment-operators": ["error", "always"],
	"no-case-declarations": "off",
	"no-cond-assign": ["error", "always"],
	"no-debugger": "error",
	"no-eval": "error",
	"no-floating-decimal": "error",
	"no-implicit-coercion": [
		"error",
		{ boolean: false, number: true, string: true },
	],
	"consistent-return": "off",
	"no-implicit-globals": "error",
	"no-invalid-this": "error",
	"no-nested-ternary": "error",
	"no-new": "error",
	"no-param-reassign": ["error", { props: true }],
	"no-shadow": "error",
	"no-shadow-restricted-names": "error",
	"no-unreachable": "error",
	"no-unused-expressions": "off",
	"@typescript-eslint/no-unused-expressions": [
		"error",
		{
			allowShortCircuit: false,
			allowTernary: false,
			allowTaggedTemplates: false,
		},
	],
	"no-unused-labels": "error",
	"no-useless-catch": "error",
	"no-useless-constructor": "error",
	"no-useless-escape": "error",
	"no-useless-return": "error",
	"no-var": "error",
	"no-with": "error",
	"object-shorthand": "error",
	"one-var": ["error", "never"],
	"prefer-arrow-callback": ["error", { allowNamedFunctions: true }],
	"prefer-destructuring": "off",
	"handle-callback-err": ["error", "^(err|error)$"],
	curly: ["error", "all"],
	eqeqeq: ["error", "always"],
	"no-console": ["warn", { allow: ["warn", "error"] }],
	"max-lines-per-function": ["warn", 200],
	"no-duplicate-imports": "error",
	// Allow void as a statement (for fire-and-forget calls)
	"no-void": ["error", { allowAsStatement: true }],

	"max-params": ["error", { max: 2 }],
};

export const settings = {
	"boundaries/elements": [
		{ type: "shared", pattern: "shared/**/*" },
		{ type: "api", pattern: "api/**/*" },
		{ type: "react", pattern: "react/**/*" },
	],
};

export default [
	{
		ignores: [
			"dist/**",
			"api/.wrangler/**",
			"api/dist/**",
			"**/node_modules/**",
			".vite/**",
			"build/**",
			"**/*.min.js",
			"**/*.d.ts",
			"**/*.js",
			"coverage/**",
			".next/**",
			"out/**",
			"shared/src/generated/**",
		],
	},
	{
		settings: {
			"boundaries/elements": [
				{ type: "shared", pattern: "shared/**/*" },
				{ type: "api", pattern: "api/**/*" },
				{ type: "react", pattern: "react/**/*" },
			],
		},
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	// Allow process.env by default in non-project-specific files. Individual
	// file-scoped configs below (react/shared/api) will explicitly disable
	// this global where process.env should remain disallowed.
	{
		languageOptions: {
			globals: {
				process: "readonly",
			},
		},
	},
	{
		files: [
			"react/src/**/*.{ts,tsx}",
			"shared/src/**/*.{ts,tsx}",
			"scripts/**/*.{ts,tsx}",
			"*.{ts,tsx}",
		],
		plugins: {
			...sharedPlugins,
			"react-hooks": reactHooksPlugin,
			"react-refresh": reactRefreshPlugin,
			"jsx-a11y": jsxA11yPlugin,
		},
		languageOptions: {
			ecmaVersion: 2020,
			// Explicitly disable `process` in react/shared files so that
			// `process.env` usage remains disallowed here per project policy.
			globals: {
				...globals.browser,
				process: false,
			},
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
				project: [
					"./tsconfig.json",
					"./tsconfig.app.json",
					"./tsconfig.node.json",
					"./tsconfig.functions.json",
					"./tsconfig.config.json",
				],
				tsconfigRootDir: __dirname,
			},
		},
		rules: {
			...reactHooksPlugin.configs.recommended.rules,
			...jsxA11yPlugin.configs.recommended.rules,
			...sharedRules,

			"import-x/no-extraneous-dependencies": "error",

			// React-specific rules
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",
			"react-refresh/only-export-components": [
				"warn",
				{ allowConstantExport: true },
			],

			// Prevent importing ambient React types and restrict certain type usage
			"no-restricted-imports": [
				"error",
				{
					paths: [
						{
							name: "react",
							importNames: ["ReactElement"],
							message:
								"ReactElement is an ambient type and should be used directly without importing.",
						},
						{
							name: "react",
							importNames: ["JSX", "FC", "FunctionComponent"],
							message:
								"Use ReactElement for function component return types. JSX, FC, and FunctionComponent are not allowed in this project.",
						},
					],
				},
			],

			// Frontend-specific module restrictions
			"no-restricted-modules": ["error", "fs", "cluster"],
		},
	},
	// Storybook configuration
	{
		files: ["**/*.stories.@(js|jsx|ts|tsx)"],
		plugins: {
			storybook: storybookPlugin,
		},
		rules: {
			...storybookPlugin.configs.recommended.rules,
		},
	},
	// Cloudflare Workers specific configuration for API
	{
		files: ["api/src/**/*.{ts,js}"],
		languageOptions: {
			// Disable `process` in Cloudflare Workers (api/src) so
			// process.env usage is not allowed there.
			globals: {
				...globals.worker,
				...globals.es2020,
				process: false,
			},
			parserOptions: {
				project: "./api/tsconfig.json",
				tsconfigRootDir: __dirname,
			},
		},
		plugins: {
			...sharedPlugins,
		},
		rules: {
			...sharedRules,

			// Cloudflare Workers specific rules
			"no-restricted-globals": [
				"error",
				{
					name: "window",
					message: "window is not available in Cloudflare Workers",
				},
				{
					name: "document",
					message: "document is not available in Cloudflare Workers",
				},
			],

			// API-specific module restrictions (more restrictive than frontend)
			"no-restricted-modules": ["error", "fs", "cluster", "child_process"],
		},
	},
	// Cloudflare Pages Functions configuration
	{
		files: ["functions/**/*.{ts,js}"],
		languageOptions: {
			globals: {
				...globals.worker,
				...globals.es2020,
			},
			parserOptions: {
				project: "./tsconfig.functions.json",
				tsconfigRootDir: __dirname,
			},
		},
		plugins: {
			...sharedPlugins,
		},
		rules: {
			...sharedRules,

			// Pages Functions specific rules (similar to Workers but lighter)
			"no-restricted-globals": [
				"error",
				{
					name: "window",
					message: "window is not available in Pages Functions",
				},
				{
					name: "document",
					message: "document is not available in Pages Functions",
				},
			],

			// Pages Functions module restrictions
			"no-restricted-modules": ["error", "fs", "cluster", "child_process"],

			// Allow shorter functions for middleware
			"max-lines-per-function": ["warn", 50],
		},
	},
	// Config/scripts files: disable restricted globals/modules rules
	{
		files: [
			"*.config.{js,ts}",
			"*.cjs",
			"*.mjs",
			"*.cts",
			"*.mts",
			"scripts/**/*.{js,ts}",
		],
		languageOptions: {
			// Config files run in Node context — allow Node globals including
			// `process` (readonly to prevent assignments).
			globals: {
				...globals.node,
				process: "readonly",
			},
		},
		rules: {
			"no-restricted-globals": "off",
			"no-restricted-modules": "off",
			// Allow use of `process.env` in config and script files (playwright,
			// build scripts, etc.). Also relax strict-boolean-expressions for
			// these files so checks like `process.env.CI ? 2 : 0` aren't flagged.
			"no-process-env": "off",
			"@typescript-eslint/strict-boolean-expressions": "off",
		},
	},
];
