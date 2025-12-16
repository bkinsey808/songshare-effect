/* eslint-disable import/unambiguous */
// Ambient declarations for butterchurn — kept minimal and lint-free. This
// file is deliberately an ambient .d.ts script (no exports) so TypeScript's
// module declarations are visible project-wide.
/*
 * Ambient module declarations for butterchurn packages. This file is intentionally
 * a script-style `.d.ts` (no top-level exports) so the `declare module` blocks
 * are picked up by the TypeScript compiler and by VSCode's tsserver.
 */
declare module "butterchurn" {
  const butterchurn: unknown;
  export default butterchurn;
}

declare module "butterchurn-presets" {
  const presets: unknown;
  export default presets;
}

// Mark the file as a module for ESLint's unambiguous-module rule. This is
// a no-op export that doesn't alter the ambient `declare module` blocks
// above, but satisfies the linter which otherwise warns that the file
// could be parsed as a script.
// Add a tiny exported marker so ESLint and the TypeScript program treat
// this file as a module (avoids ambiguous script/module parsing). The
// marker is declared in the `.d.ts` surface only and doesn't change runtime
// behavior.
// Keep this file a script-style `.d.ts` so `declare module` blocks are
// ambient and visible to the TypeScript program. We purposefully disable
// the `import/unambiguous` rule because this file is intentionally not a module.
/* eslint-disable import/unambiguous */
