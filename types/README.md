# Type augmentations for Vitest coverage (why both .ts and .d.ts)

This directory contains local TypeScript augmentations that make the
`coverage.all` option available to the project's TypeScript toolchain —
Vitest accepts the `all` runtime option for the `v8` provider, but the
published Vitest type declarations (at the time of writing) do not include
`CoverageV8Options.all`.

Why there are two files

- `vitest-coverage-augment.d.ts` — a global declaration file that augments
  the `vitest` and `vitest/config` modules with `all?: boolean` on
  `CoverageV8Options`.
  - Pros: always visible to TypeScript and editors (tsserver), no need to
    import it; good for tools and type-only contexts.

- `vitest-coverage-augment.ts` — an importable ESM module that performs the
  same augmentation and exports a tiny runtime symbol (`VITEST_COVERAGE_AUGMENT`).
  - Pros: importing the module (for example from `vitest.config.ts`) forces
    editors / tsserver to pick up the augmentation immediately and also
    provides a lint-friendly importable symbol (ESLint rules that disallow
    triple-slash references are avoided this way).

Recommended usage

- Keep both files in the repo. This gives the best developer experience:
  - The `.d.ts` file serves as a global safety net so tools that only load
    type definitions still see the `all` option.
  - The `.ts` file can be imported from configuration files (for immediate
    editor recognition) and to satisfy lint rules that complain about
    triple-slash references or unassigned imports.

Alternatives

- If you'd rather not import the `.ts` augmentation everywhere, you may keep
  only the `.d.ts` file — but some editors may need a TS server restart to
  pick up the new global declarations quickly.
- If you'd rather rely solely on the `.ts` import, make sure all files that
  need the augmentation import it at the top (for example `vitest.config.ts`).

If you want, I can convert these into a single approach (remove one of the
files and update the import paths) — but keeping both is the least surprising
and most robust approach for the project today.
