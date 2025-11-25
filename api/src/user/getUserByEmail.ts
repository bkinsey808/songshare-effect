/* eslint-disable no-console */
import { Effect, Schema } from "effect";

import type { ReadonlySupabaseClient } from "@/api/supabase/supabase-client";

import { DatabaseError } from "@/api/errors";
import { getErrorMessage } from "@/api/getErrorMessage";
import { normalizeNullsTopLevel } from "@/api/oauth/normalizeNullsTopLevel";
import { normalizeLinkedProviders } from "@/api/provider/normalizeLinkedProviders";
import { parseMaybeSingle } from "@/api/supabase/parseMaybeSingle";
import { UserSchema } from "@/shared/generated/supabaseSchemas";
import { decodeUnknownSyncOrThrow } from "@/shared/validation/decode-or-throw";

function isRecordStringUnknown(x: unknown): x is Record<string, unknown> {
	return typeof x === "object" && x !== null;
}

// Supabase response shape handled via `parseMaybeSingle`

type GetUserByEmailParams = Readonly<{
	supabase: Readonly<ReadonlySupabaseClient>;
	email: string;
}>;

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
 * @param params - The parameters for the function.
 * @param params.supabase - An instantiated Supabase client used to query the DB.
 * @param params.email - Email address to look up (case and normalization should be
 * handled by the caller if necessary).
 * @returns A promise that resolves to the validated user object (with
 * runtime-normalized `linked_providers: string[]`) or `undefined` when no
 * matching user exists or when the user table is absent in preview.
 * @throws Will re-throw unexpected Supabase/PostgREST errors so callers can
 * map them to an HTTP 500. The `PGRST205` PostgREST error is treated as
 * "not found" and does not throw.
 */
export function getUserByEmail({
	supabase,
	email,
}: GetUserByEmailParams): Effect.Effect<
	Schema.Schema.Type<typeof UserSchema> | undefined,
	DatabaseError
> {
	return Effect.gen(function* ($) {
		// Best-effort debug logging (synchronous)
		yield* $(
			Effect.sync(() => {
				console.log("[getUserByEmail] Looking up user by email:", email);
			}),
		);

		// Perform the Supabase query as a Promise and map any thrown error to DatabaseError
		const rawRes: unknown = yield* $(
			Effect.tryPromise<
				{
					data: unknown;
					error: unknown;
				},
				unknown
			>({
				try: async () =>
					supabase.from("user").select("*").eq("email", email).maybeSingle(),
				catch: (err) => err,
			}).pipe(
				Effect.mapError(
					(err) => new DatabaseError({ message: getErrorMessage(err) }),
				),
			),
		);

		const res = parseMaybeSingle(rawRes);

		// Debug: log the raw Supabase response data
		yield* $(
			Effect.sync(() => {
				console.log("[getUserByEmail] Raw Supabase data:", res.data);
			}),
		);

		// Debug output to aid diagnosing preview vs production differences
		try {
			yield* $(
				Effect.sync(() => {
					const errInfo = (() => {
						const e = res.error;
						if (e === null || e === undefined) return undefined;
						if (isRecordStringUnknown(e)) {
							const code =
								typeof e["code"] === "string" ? e["code"] : undefined;
							const message =
								typeof e["message"] === "string"
									? e["message"]
									: getErrorMessage(e["message"]);
							return { code, message };
						}
						return { message: getErrorMessage(e) };
					})();
					console.log("[getUserByEmail] Supabase response:", {
						status: res.status,
						error: errInfo,
						hasData: res.data !== undefined,
					});
				}),
			);
		} catch (err) {
			// don't fail the effect because logging failed
			yield* $(
				Effect.sync(() => {
					console.log(
						"[getUserByEmail] Failed to stringify Supabase response",
						getErrorMessage(err),
					);
				}),
			);
		}

		// Handle PostgREST table-not-exists (e.g. PGRST205) as "not found"
		if (res.error !== undefined && res.error !== null) {
			try {
				const maybeErr = res.error;
				if (isRecordStringUnknown(maybeErr)) {
					if (
						typeof maybeErr["code"] === "string" &&
						maybeErr["code"] === "PGRST205"
					) {
						return undefined;
					}
				}
			} catch {
				// fall through to throw below
			}
			// Map to DatabaseError
			return yield* $(
				Effect.fail(new DatabaseError({ message: getErrorMessage(res.error) })),
			);
		}

		if (res.data === undefined || res.data === null) {
			return undefined;
		}

		// Normalize nulls -> undefined for optional top-level fields
		const sanitized = normalizeNullsTopLevel(res.data);

		// Validate against generated schema (may throw) and map failures.
		// Use a small shared helper to centralize the decode call so we don't
		// repeat ad-hoc unsafe assertions in many files.
		let validated: Schema.Schema.Type<typeof UserSchema>;
		try {
			validated = decodeUnknownSyncOrThrow(UserSchema, sanitized);
		} catch (err) {
			return yield* $(
				Effect.fail(new DatabaseError({ message: getErrorMessage(err) })),
			);
		}

		// Normalize linked_providers at runtime; failures fall back to [] and
		// are logged for debugging.
		let normalizedProviders: string[] = [];
		try {
			normalizedProviders = normalizeLinkedProviders(validated);
		} catch (err) {
			yield* $(
				Effect.sync(() => {
					console.log(
						"[getUserByEmail] Failed to normalize linked_providers at runtime:",
						getErrorMessage(err),
					);
				}),
			);
			normalizedProviders = [];
		}

		// Merge the runtime-normalized providers onto the validated user and
		// return. We perform a single, localized assertion at the return site
		// to match the function's declared Effect type.
		const merged = { ...validated, linked_providers: normalizedProviders };
		let finalUser: Schema.Schema.Type<typeof UserSchema>;
		try {
			finalUser = decodeUnknownSyncOrThrow(UserSchema, merged);
		} catch (err) {
			return yield* $(
				Effect.fail(new DatabaseError({ message: getErrorMessage(err) })),
			);
		}

		return finalUser;
	});
}
