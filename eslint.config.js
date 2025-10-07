import cspellPlugin from "@cspell/eslint-plugin";
import js from "@eslint/js";
import boundariesPlugin from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";
import jsdocPlugin from "eslint-plugin-jsdoc";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import prettierPlugin from "eslint-plugin-prettier";
import promisePlugin from "eslint-plugin-promise";
import reactCompiler from "eslint-plugin-react-compiler";
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
};

const sharedRules = {
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
	"jsdoc/check-indentation": "warn",
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
	{
		files: [
			"react/src/**/*.{ts,tsx}",
			"shared/**/*.{ts,tsx}",
			"scripts/**/*.{ts,tsx}",
			"*.{ts,tsx}",
		],
		plugins: {
			...sharedPlugins,
			"react-hooks": reactHooksPlugin,
			"react-refresh": reactRefreshPlugin,
			"react-compiler": reactCompiler,
			"jsx-a11y": jsxA11yPlugin,
		},
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
				project: [
					"./tsconfig.json",
					"./tsconfig.app.json",
					"./tsconfig.node.json",
					"./tsconfig.functions.json",
				],
				tsconfigRootDir: __dirname,
			},
		},
		rules: {
			...reactHooksPlugin.configs.recommended.rules,
			...jsxA11yPlugin.configs.recommended.rules,
			...sharedRules,

			// React-specific rules
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",
			"react-refresh/only-export-components": [
				"warn",
				{ allowConstantExport: true },
			],
			"react-compiler/react-compiler": "error",

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
			globals: {
				...globals.worker,
				...globals.es2020,
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
];
