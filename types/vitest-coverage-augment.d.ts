// Augment Vitest's types so the v8 coverage provider accepts `all` (runtime option)
// Vitest's shipped types don't include `all` on the V8 coverage options but the
// runtime accepts it; adding this augmentation avoids editor/TS errors.
declare module "vitest" {
	// Existing CoverageV8Options extends BaseCoverageOptions, we add `all` here
	// so `coverage: { provider: 'v8', all: true }` is accepted by the TS server.
	// oxlint-disable-next-line consistent-type-definitions
	interface CoverageV8Options {
		/**
		 * Include all files (even those not imported by tests) in coverage reports
		 * (same runtime behavior as Vitest's `all` option for coverage).
		 */
		all?: boolean;
	}
}

// Also augment the `vitest/config` entry which `defineConfig` imports from.
declare module "vitest/config" {
	// Repeat the same addition so that config-specific imports pick it up too.
	// oxlint-disable-next-line consistent-type-definitions
	interface CoverageV8Options {
		/** Include all files in coverage reports */
		all?: boolean;
	}
}

// Module augmentation for any chunks path (covers hashed chunk filenames)
// Also add augmentations for a few public/internal module names Vitest uses
// so the type merges correctly regardless of how the library exposes it.
// (No direct augment for internal chunk module names — TS will not accept
// augmentation for module paths that can't be resolved. We augment the public
// module names above: `vitest` and `vitest/config`.)

// Module augmentation for any chunks path (covers hashed chunk filenames)
// Also add augmentations for a few public/internal module names Vitest uses
// so the type merges correctly regardless of how the library exposes it.
// (No direct augment for internal chunk module names — TS will not accept
// augmentation for module paths that can't be resolved. We augment the public
// module names above: `vitest` and `vitest/config`.)

// Make this file a module so linters and tools don't parse it as a script.
// We don't export any runtime values here — the file only contains type
// augmentations — but `export {}` marks it unambiguously as an ES module.
// eslint-disable-next-line unicorn/require-module-specifiers
export {};
