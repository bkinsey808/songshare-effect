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
// import storybookPlugin from "eslint-plugin-storybook";
import unicornPlugin from "eslint-plugin-unicorn";
import globals from "globals";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

import cspellPlugin from "@cspell/eslint-plugin";
import js from "@eslint/js";
import shopifyPlugin from "@shopify/eslint-plugin";
import shopifyTsConfig from "@shopify/eslint-plugin/lib/config/typescript.js";

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
			...cfg.rules,
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
				// `shared` should not import other element types — default: disallow
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
	// Enforce readonly parameter types for better immutability
	"@typescript-eslint/prefer-readonly-parameter-types": [
		"error",
		{
			checkParameterProperties: true,
			ignoreInferredTypes: true,
			treatMethodsAsReadonly: true,
			allow: [
				{ from: "file", name: "MouseEvent" },
				{ from: "file", name: "KeyboardEvent" },
				{ from: "file", name: "FormEvent" },
				{ from: "file", name: "ChangeEvent" },
				{ from: "file", name: "ReactNode" },
				{ from: "file", name: "ReactElement" },
				{ from: "package", name: "ReactNode", package: "react" },
				{ from: "package", name: "ReactElement", package: "react" },
				{ from: "file", name: "RefObject" },
				{ from: "file", name: "DOMRect" },
				{ from: "file", name: "HTMLElement" },
				{ from: "file", name: "Element" },
				{ from: "file", name: "Response" },
				{ from: "file", name: "URL" },
				{ from: "file", name: "Headers" },
				{
					from: "package",
					name: "RealtimePostgresChangesPayload",
					package: "@supabase/supabase-js",
				},
				{
					from: "package",
					name: "RealtimeChannel",
					package: "@supabase/supabase-js",
				},
				{
					from: "package",
					name: "SupabaseClient",
					package: "@supabase/supabase-js",
				},
				{ from: "package", name: "RefObject", package: "react" },
				{ from: "package", name: "Dispatch", package: "react" },
				{ from: "package", name: "SetStateAction", package: "react" },
				{ from: "package", name: "SVGProps", package: "react" },
				{ from: "package", name: "ComponentProps", package: "react" },
				{ from: "package", name: "HTMLProps", package: "react" },
				{ from: "package", name: "HTMLInputElement", package: "@types/react" },
				{ from: "package", name: "HTMLFormElement", package: "@types/react" },
				{ from: "package", name: "DragEndEvent", package: "@dnd-kit/core" },
				{ from: "file", name: "ReadonlyDeep" },
				{
					from: "file",
					name: "ReadonlyContext",
					path: "api/src/types/hono-context.ts",
				},
				{
					from: "file",
					name: "ReadonlySupabaseClient",
					path: "api/src/types/supabase-client.ts",
				},
				{ from: "file", name: "ReadonlyUser", path: "api/src/types/user.ts" },
				{
					from: "file",
					name: "ReadonlyOauthUserData",
					path: "shared/src/oauth/oauthUserData.ts",
				},
				{
					from: "file",
					name: "ReadonlyOauthState",
					path: "shared/src/oauth/oauthState.ts",
				},
				{
					from: "file",
					name: "BuildUserSessionJwtParams",
					path: "api/src/types/user-session.ts",
				},
				{ from: "file", name: "ReadonlyContext" },
				{ from: "file", name: "ReadonlySupabaseClient" },
				{ from: "file", name: "ReadonlyUser" },
				{ from: "file", name: "ReadonlyOauthUserData" },
				{ from: "file", name: "ReadonlyOauthState" },
				{ from: "file", name: "ReadonlyContext" },
				{ from: "file", name: "ReadonlySupabaseClient" },
				{ from: "file", name: "BuildUserSessionJwtParams" },
				{
					from: "file",
					name: "BuildUserSessionJwtParams",
					path: "api/src/userSession/buildUserSessionJwt.ts",
				},
				{ from: "file", name: "ReadonlyUser" },
				{ from: "file", name: "ReadonlyOauthUserData" },
				{ from: "file", name: "ReadonlyOauthState" },
				{ from: "file", name: "Bindings" },
				{ from: "package", name: "Schema", package: "effect" },
				{ from: "file", name: "FetchOpts" },
				{ from: "file", name: "Env" },
				{ from: "file", name: "User" },
				{ from: "file", name: "OauthUserData" },
				{ from: "file", name: "OauthState" },
				{ from: "package", name: "verify", package: "hono/jwt" },
				{ from: "file", name: "Record" },
				{ from: "file", name: "Partial" },
				{ from: "file", name: "Schema" },
				{ from: "file", name: "number" },
				{ from: "file", name: "string" },
				{ from: "file", name: "boolean" },
				{ from: "file", name: "Array" },
				{ from: "file", name: "ReadonlyArray" },
			],
		},
	],

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

	// eslint-comments rules — detect unused disable/enable directives
	// Promote these to errors so the editor more likely renders a visible
	// diagnostic for unused eslint-disable/enable directives. The rule is
	// also useful as a repository hygiene check and is enforced during
	// `npm run lint:strict`.
	"eslint-comments/no-unused-disable": "error",
	"eslint-comments/no-unused-enable": "error",

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
			"api/src/**/*.{ts,tsx}",
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

			// React Compiler optimizations - discourage manual memoization
			"no-restricted-imports": [
				"error",
				{
					paths: [
						{
							name: "react",
							importNames: ["ReactElement"],
							message:
								"Prefer using the React Compiler optimizations; avoid manual memoization",
						},
					],
				},
			],
		},
	},
	// Scripts should be allowed to use `process.env` while keeping all other
	// project rules from the override above. The main project override sets
	// `process` to `false` to disallow `process.env` in React/shared/api code;
	// this specific override re-enables `process` for scripts only.
	{
		files: ["scripts/**/*"],
		languageOptions: {
			globals: {
				process: "readonly",
			},
		},
		rules: {
			// Disable the one rule that prohibits direct use of process.env
			// in scripts; scripts often read env vars for local tooling.
			"no-process-env": "off",

			// Allow console.log in scripts without ESLint warnings. Scripts
			// are tooling helpers and frequently rely on console output.
			"no-console": "off",
		},
	},
	// Allow top-level config files to use `process.env` (Playwright,
	// Wrangler, Vite, etc). These files commonly read environment
	// variables to configure tooling and are not part of the runtime
	// application code where `process.env` is disallowed.
	{
		files: [
			"*.config.{js,mjs,ts}",
			"*.rc.{js,mjs,ts}",
			"playwright.config.{js,mjs,ts}",
			"wrangler.*",
		],
		languageOptions: {
			globals: {
				process: "readonly",
			},
		},
		rules: {
			// Config files may legitimately read env vars for tooling.
			"no-process-env": "off",

			// Config files live at the repository root and often use tooling
			// patterns (nullable env vars, conditional strings, etc). Relax
			// strict boolean expressions for these files so tooling configs
			// aren't forced to handle every nullish/empty case explicitly.
			"@typescript-eslint/strict-boolean-expressions": "off",
		},
	},
];
