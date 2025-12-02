// Module-style augmentation so editors and linters pick up the types via ESM import
// Use this instead of a triple-slash reference.

declare module "vitest" {
	// Add runtime-supported `all` option for the v8 provider
	// oxlint-disable-next-line consistent-type-definitions
	interface CoverageV8Options {
		/** Include all files (even those not imported by tests) in coverage reports */
		all?: boolean;
	}
}

declare module "vitest/config" {
	// oxlint-disable-next-line consistent-type-definitions
	interface CoverageV8Options {
		all?: boolean;
	}
}

// Export a tiny runtime symbol so configs can import this module in a lint-friendly
// way (ESLint prefers imports to be assigned/used). The value isn't used at
// runtime — it's only here so the import is a real assigned import and satisfies
// lint rules.
// oxlint-disable-next-line prefer-default-export
export const VITEST_COVERAGE_AUGMENT = true;
