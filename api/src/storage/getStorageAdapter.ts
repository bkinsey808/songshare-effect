import { createClient } from "@supabase/supabase-js";

import type { Bindings } from "../env";
import createR2Adapter from "./createR2Adapter";
import createSupabaseStorageAdapter from "./createSupabaseStorageAdapter";
import type { StorageAdapter } from "./StorageAdapter.type";

/** Value of STORAGE_BACKEND that selects Cloudflare R2 */
const R2_BACKEND = "r2";

/**
 * Returns the active StorageAdapter based on the `STORAGE_BACKEND` environment
 * variable. Defaults to Supabase Storage when the variable is absent.
 *
 * Supported values:
 * - `"supabase"` (default) — Supabase Storage public bucket named "images"
 * - `"r2"` — Cloudflare R2; requires a `BUCKET` binding in wrangler.toml
 *
 * @param env - The Worker bindings environment.
 * @returns A configured StorageAdapter instance.
 */
export default function getStorageAdapter(env: Bindings): StorageAdapter {
	if (env.STORAGE_BACKEND === R2_BACKEND) {
		if (env.BUCKET === undefined) {
			throw new Error(
				"STORAGE_BACKEND is 'r2' but no BUCKET binding is configured in wrangler.toml",
			);
		}
		return createR2Adapter(env.BUCKET);
	}

	// Default: Supabase Storage
	const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
	return createSupabaseStorageAdapter(supabase);
}
