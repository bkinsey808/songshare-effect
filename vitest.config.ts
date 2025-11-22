import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const workspaceDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: [
					[
						"babel-plugin-react-compiler",
						{
							compilationMode: "infer",
							panicThreshold: "all_errors",
						},
					],
				],
			},
		}),
	],
	resolve: {
		alias: {
			"@/react": path.resolve(workspaceDir, "./react/src"),
			"@/shared": path.resolve(workspaceDir, "./shared/src"),
			"@/api": path.resolve(workspaceDir, "./api/src"),
		},
	},
	test: {
		reporters: [
			"default",
			[
				"junit",
				{
					outputFile: "reports/unit-junit.xml",
				},
			],
		],
		environment: "jsdom",
		include: ["**/*.test.ts", "**/*.test.tsx"],
		exclude: [
			"**/*.spec.ts",
			"**/*.spec.tsx",
			"dist/**",
			"node_modules/**",
			"e2e/**",
		],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov"],
			all: true,
			// Baseline minimums — raise these incrementally as coverage improves
			statements: 55,
			branches: 60,
			functions: 90,
			lines: 55,
		},
	},
});
