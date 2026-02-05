/**
 * Shared constants used by the find-missing-jsdoc scripts.
 */
export const DEFAULT_DIRS: string[] = ["react", "shared", "api"];
export const IGNORED = new Set(["node_modules", "dist", "build", "coverage", ".git", "tmp"]);
export const TS_EXTS = new Set([".ts", ".tsx"]);

// Config / constants
export const LOOKBACK_LINES = 32;
export const ARGV_START_INDEX = 2;
export const EXIT_OK = 0;
export const EXIT_ERROR = 1;
