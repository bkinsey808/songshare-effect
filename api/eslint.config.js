import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
	{ ignores: ["dist", "node_modules", ".wrangler", "eslint.config.js"] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ["src/**/*.{ts,js}"],
		languageOptions: {
			ecmaVersion: 2020,
			globals: {
				...globals.worker,
				...globals.es2020,
			},
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
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
			// TypeScript specific rules
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_" },
			],
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/no-explicit-any": "warn",
		},
	},
];
