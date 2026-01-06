import { type SupabaseClient } from "@supabase/supabase-js";

import { type ReadonlyDeep } from "@/shared/types/deep-readonly";

/**
 * A canonical readonly supabase client type used across API helpers.P
 *
 * This mirrors the repo-wide `ReadonlyContext` pattern and makes helper
 * signatures clearer while satisfying the `prefer-readonly-parameter-types`
 * rule used by this repository.
 */
export type ReadonlySupabaseClient = ReadonlyDeep<SupabaseClient>;
