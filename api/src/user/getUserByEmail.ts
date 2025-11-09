/* eslint-disable no-console */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import { DatabaseError } from "@/api/errors";
import { normalizeNullsTopLevel } from "@/api/oauth/normalizeNullsTopLevel";
import { normalizeLinkedProviders } from "@/api/provider/normalizeLinkedProviders";
import { UserSchema } from "@/shared/generated/supabaseSchemas";

type SupabaseMaybeSingleRes = {
	data?: unknown;
	error?: unknown;
	status?: number;
};

/**
 * Lookup a user by email using a Supabase client and return a validated user
 * object suitable for session creation.
 *
 * This function performs several responsibilities:
 * - Queries the `user` table for a single row matching the provided email.
 * - Treats certain PostgREST errors (notably `PGRST205`, which indicates the
 * table is missing in preview environments) as "not found" and returns
 * `undefined` so callers can continue to registration flows instead of
 * returning HTTP 500.
 * - Normalizes SQL NULLs (Supabase returns SQL NULL as `null`) to `undefined`
 * for top-level optional fields so the value validates against the
 * generated Effect `UserSchema` (which expects `string | undefined`).
 * - Validates the sanitized row against `UserSchema` and performs a runtime
 * normalization of `linked_providers` into a `string[]` for easier use by
 * callers (e.g. `Array.includes`). If runtime normalization fails, an
 * empty array is used and a debug message is logged.
 *
 * Notes:
 * - The function logs debug information about the Supabase response to aid
 * diagnosing environment differences (preview vs production).
 * - On unexpected Supabase/PostgREST errors (other than the handled
 * `PGRST205` case) the original error is re-thrown so upstream callers
 * can map it to an HTTP 500.
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
export function getUserByEmail(
	// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- SupabaseClient is complex external type
	supabase: SupabaseClient,
	email: string,
): Effect.Effect<
	Schema.Schema.Type<typeof UserSchema> | undefined,
	DatabaseError
> {
	return Effect.gen(function* ($) {
		// Best-effort debug logging (synchronous)
		yield* $(
			Effect.sync(() =>
				console.log("[getUserByEmail] Looking up user by email:", email),
			),
		);

		// Perform the Supabase query as a Promise and map any thrown error to DatabaseError
		const res: SupabaseMaybeSingleRes = yield* $(
			Effect.tryPromise<
				{
					data: unknown;
					error: unknown;
				},
				unknown
			>({
				try: () =>
					supabase.from("user").select("*").eq("email", email).maybeSingle(),
				catch: (err) => err,
			}).pipe(
				Effect.mapError((err) => new DatabaseError({ message: String(err) })),
			),
		);

		// Debug: log the raw Supabase response data
		yield* $(
			Effect.sync(() =>
				console.log("[getUserByEmail] Raw Supabase data:", res.data),
			),
		);

		// Debug output to aid diagnosing preview vs production differences
		try {
			yield* $(
				Effect.sync(() =>
					console.log("[getUserByEmail] Supabase response:", {
						status: res.status,
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
					}),
				),
			);
		} catch (err) {
			// don't fail the effect because logging failed
			yield* $(
				Effect.sync(() =>
					console.log(
						"[getUserByEmail] Failed to stringify Supabase response",
						String(err),
					),
				),
			);
		}

		// Handle PostgREST table-not-exists (e.g. PGRST205) as "not found"
		if (res.error !== undefined && res.error !== null) {
			try {
				const maybeErr = res.error as unknown;
				if (maybeErr !== null && typeof maybeErr === "object") {
					const obj = maybeErr as Record<string, unknown>;
					if (typeof obj.code === "string" && obj.code === "PGRST205") {
						return undefined;
					}
				}
			} catch {
				// fall through to throw below
			}
			// Map to DatabaseError
			return yield* $(
				Effect.fail(new DatabaseError({ message: String(res.error) })),
			);
		}

		if (res.data === undefined || res.data === null) {
			return undefined;
		}

		// Normalize nulls -> undefined for optional top-level fields
		const sanitized = normalizeNullsTopLevel(res.data);

		// Validate against generated schema (may throw) and map failures
		let validated: Schema.Schema.Type<typeof UserSchema>;
		try {
			validated = Schema.decodeUnknownSync(UserSchema)(sanitized as unknown);
		} catch (err) {
			return yield* $(Effect.fail(new DatabaseError({ message: String(err) })));
		}

		// Ensure linked_providers is a runtime string[] for ease of use
		const runtimeUser = {
			...(validated as unknown as Record<string, unknown>),
		} as Record<string, unknown>;
		try {
			runtimeUser.linked_providers = normalizeLinkedProviders(validated);
		} catch (err) {
			yield* $(
				Effect.sync(() =>
					console.log(
						"[getUserByEmail] Failed to normalize linked_providers at runtime:",
						String(err),
					),
				),
			);
			runtimeUser.linked_providers = [];
		}

		return runtimeUser as unknown as Schema.Schema.Type<typeof UserSchema>;
	});
}
