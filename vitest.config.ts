import react from "@vitejs/plugin-react";
// Importable augmentation ensures the editor / tsserver picks up the
// `coverage.all` option for the v8 provider. The augmentation lives in
// `types/vitest-coverage-augment.ts` (importable) so configuration files can
// import it and editors pick up the change immediately.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

import { VITEST_COVERAGE_AUGMENT } from "./types/vitest-coverage-augment";
// Touch the imported symbol so it counts as used and keeps ESLint from complaining
// about unassigned/unused imports. This is the single-file (importable) approach.
void VITEST_COVERAGE_AUGMENT;
const workspaceDir = fileURLToPath(new URL(".", import.meta.url));

// Extract the coverage type from the defineConfig parameter so we can cast
// our local coverage object safely without using `any`.
// (We keep a small local augmentation import so the editor picks up the added
// `all` property. The vitest coverage literal contains a runtime-only
// `all` option that the shipped TS types don't include; we cast the literal
// inline to avoid type errors while keeping the rest of the config strongly
// typed.)

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
			"@/scripts": path.resolve(workspaceDir, "./scripts"),
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
		environmentOptions: {
			jsdom: {
				url: "https://localhost",
			},
		},
		include: ["**/*.test.ts", "**/*.test.tsx"],
		exclude: ["**/*.spec.ts", "**/*.spec.tsx", "dist/**", "node_modules/**", "e2e/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov"],
			all: true,
			// Baseline minimums — raise these incrementally as coverage improves
			statements: 55,
			branches: 60,
			functions: 90,
			lines: 55,
			/* oxlint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion */
		} as any,
	},
});
