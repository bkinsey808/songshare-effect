/* eslint-disable import/unambiguous */
/// <reference types="react" />
// Global type declarations used across the React app

declare global {
  // Provide a convenient ReactElement alias using the types reference above.
  type ReactElement = React.ReactNode;
}

// runtime marker where the library may be stored on the global object
declare global {
  var __butterchurn_lib: unknown;
}

// NOTE: butterchurn module declarations are defined in
// `react/src/butterchurn.declare.d.ts` (canonical single source). Don't
// duplicate them here to avoid diagnostic conflicts.

// This file intentionally has no top-level exports so it's treated as an
// ambient (script) declaration file by TypeScript and the `declare module`
// blocks are visible globally. ESLint 'import/unambiguous' is disabled above.
const __global_types_marker = true as const;
export default __global_types_marker;

