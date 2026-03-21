import { vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { TagLibrarySlice } from "./slice/TagLibrarySlice.type";

/**
 * Create a fake `TagLibrary` slice getter and a set of spy functions.
 *
 * @param spies - names of spy functions to create on the slice
 * @param overrides - optional partial overrides to customize the returned slice
 * @returns an object with `get` and the requested spy functions
 */
export default function makeTagLibraryGet(
  spies: string[] = [],
  overrides: Partial<TagLibrarySlice> = {},
): Record<string, unknown> & { get: () => TagLibrarySlice } {
  // Default spies commonly used across tests when none are provided.
  const DEFAULT_SPIES = [
    "fetchTagLibrary",
    "fetchTagLibraryCounts",
    "removeTagFromLibrary",
    "subscribeToTagLibrary",
    "tagLibraryUnsubscribe",
    "setTagLibraryEntries",
    "setTagLibraryCounts",
    "addTagLibraryEntry",
    "removeTagLibraryEntry",
    "setTagLibraryLoading",
    "setTagLibraryError",
    "isInTagLibrary",
    "getTagLibrarySlugs",
  ];

  const names = [...new Set([...DEFAULT_SPIES, ...spies])];

  const fns: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const name of names) {
    fns[name] = vi.fn();
  }

  // Provide a sensible default for tag slugs used in many tests.
  if (fns["getTagLibrarySlugs"]) {
    fns["getTagLibrarySlugs"].mockReturnValue(["rock", "jazz"]);
  }

  const slice = forceCast<TagLibrarySlice>({ ...fns, ...overrides });
  const result: Record<string, unknown> & { get: () => TagLibrarySlice } = { get: () => slice };
  for (const key of names) {
    result[key] = fns[key];
  }
  return result;
}
