/**
 * Utility types for extracting parameter and return types from a
 * function-like type. We intentionally accept a wide function constraint
 * so we avoid contravariance issues with middleware-wrapped StateCreator
 * signatures (devtools / persist wrappers sometimes change API types).
 */
import type { StoreApi } from "zustand";

import type { AppSlice } from "@/react/zustand/useAppStore";

/**
 * Simple, slice-scoped convenience types for use in slice factory signatures.
 * These do not require knowledge of the full application store and are
 * intentionally lightweight.
 */

// Default the Root generic to AppSlice so slices don't need to pass the
// combined store type explicitly when they want full store-aware set/get.
export type Set<StoreSlice, Root = AppSlice> = StoreApi<
	StoreSlice & Root
>["setState"];

export type Get<StoreSlice, Root = AppSlice> = StoreApi<
	StoreSlice & Root
>["getState"];

export type Api<StoreSlice, Root = AppSlice> = StoreApi<StoreSlice & Root>;
