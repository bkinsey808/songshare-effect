/* eslint-disable no-console */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Schema } from "effect";

import { normalizeLinkedProviders } from "./normalizeLinkedProviders";
import { normalizeNullsTopLevel } from "./normalizeNullsTopLevel";
import { UserSchema } from "@/shared/generated/supabaseSchemas";

/**
 * Lookup a user by email using a Supabase client and return a validated user
 * object suitable for session creation.
 *
 * This function performs several responsibilities:
 * - Queries the `user` table for a single row matching the provided email.
 * - Treats certain PostgREST errors (notably `PGRST205`, which indicates the
 *   table is missing in preview environments) as "not found" and returns
 *   `undefined` so callers can continue to registration flows instead of
 *   returning HTTP 500.
 * - Normalizes SQL NULLs (Supabase returns SQL NULL as `null`) to `undefined`
 *   for top-level optional fields so the value validates against the
 *   generated Effect `UserSchema` (which expects `string | undefined`).
 * - Validates the sanitized row against `UserSchema` and performs a runtime
 *   normalization of `linked_providers` into a `string[]` for easier use by
 *   callers (e.g. `Array.includes`). If runtime normalization fails, an
 *   empty array is used and a debug message is logged.
 *
 * Notes:
 * - The function logs debug information about the Supabase response to aid
 *   diagnosing environment differences (preview vs production).
 * - On unexpected Supabase/PostgREST errors (other than the handled
 *   `PGRST205` case) the original error is re-thrown so upstream callers
 *   can map it to an HTTP 500.
 *
 * Example:
 * ```ts
 * const user = await getUserByEmail(supabaseClient, 'alice@example.com');
 * if (!user) {
 *   // continue to registration flow
 * }
 * // `user.linked_providers` will be a runtime `string[]` (or `[]` on error)
 * ```
 *
 * @param supabase - An instantiated Supabase client used to query the DB.
 * @param email - Email address to look up (case and normalization should be
 * handled by the caller if necessary).
 * @returns A promise that resolves to the validated user object (with
 * runtime-normalized `linked_providers: string[]`) or `undefined` when no
 * matching user exists or when the user table is absent in preview.
 * @throws Will re-throw unexpected Supabase/PostgREST errors so callers can
 * map them to an HTTP 500. The `PGRST205` PostgREST error is treated as
 * "not found" and does not throw.
 */
export async function getUserByEmail(
	supabase: SupabaseClient,
	email: string,
): Promise<Schema.Schema.Type<typeof UserSchema> | undefined> {
	console.log("[getUserByEmail] Looking up user by email:", email);
	const res = await supabase
		.from("user")
		.select("*")
		.eq("email", email)
		.maybeSingle();

	// Debug output to help diagnose preview vs. production differences and
	// why an existing user might be treated as not found.
	try {
		console.log("[getUserByEmail] Supabase response:", {
			status: (res as unknown as { status?: number })?.status,
			error: (() => {
				const errVal = res.error as unknown;
				if (errVal === null) {
					return undefined;
				}
				if (typeof errVal !== "object") {
					return { message: String(errVal) };
				}
				const obj = errVal as Record<string, unknown>;
				const code = typeof obj.code === "string" ? obj.code : undefined;
				let message: string | undefined;
				if (typeof obj.message === "string") {
					message = obj.message;
				} else if (obj.message !== undefined) {
					message = String(obj.message);
				}
				return { code, message };
			})(),
			hasData: res.data !== undefined,
		});
	} catch (err) {
		console.log(
			"[getUserByEmail] Failed to stringify Supabase response",
			String(err),
		);
	}

	if (res.error) {
		// PostgREST may return an error when the user table doesn't exist in a
		// preview environment (e.g. PGRST205). Treat that as "no user" so the
		// oauth callback can continue to the registration flow instead of 500ing.
		try {
			// Narrow the error in a type-safe way instead of using `any`.
			const maybeErr = res.error as unknown;
			if (maybeErr !== null && typeof maybeErr === "object") {
				const obj = maybeErr as Record<string, unknown>;
				if (typeof obj.code === "string" && obj.code === "PGRST205") {
					return undefined;
				}
			}
		} catch {
			// Fall back to throwing the error below
		}
		throw res.error;
	}

	if (res.data === undefined) {
		return undefined;
	}

	// Normalize null values to undefined for optional DB columns. Supabase
	// returns `null` for SQL NULL which will fail the Effect Schema validation
	// when the schema expects `string | undefined`. Convert null -> undefined
	// recursively so optional nested fields are handled too.
	const sanitized = normalizeNullsTopLevel(res.data);

	// Validate the returned row against the generated UserSchema so callers
	// receive the exact shape expected by session creation. The generator now
	// emits `linked_providers` as an array type where appropriate, so validate
	// the sanitized object directly.
	const validated = Schema.decodeUnknownSync(UserSchema)(sanitized as unknown);

	// Normalize `linked_providers` into a runtime string[] for easier usage
	// across the app. Use helper to encapsulate the parsing logic and reduce
	// cognitive complexity of the main function.
	const runtimeUser = { ...validated } as Record<string, unknown>;
	try {
		runtimeUser.linked_providers = normalizeLinkedProviders(validated);
	} catch (err) {
		console.log(
			"[getUserByEmail] Failed to normalize linked_providers at runtime:",
			String(err),
		);
		runtimeUser.linked_providers = [];
	}

	// Cast back to the declared return type to minimize upstream changes —
	// runtime shape now contains `linked_providers: string[]` which callers
	// like `oauthCallback` can work with (e.g. using Array.includes).
	return runtimeUser as unknown as Schema.Schema.Type<typeof UserSchema>;
}
