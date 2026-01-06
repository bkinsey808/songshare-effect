import { type Schema, Effect } from "effect";

import { DatabaseError } from "@/api/errors";
import getErrorMessage from "@/api/getErrorMessage";
import { debug as serverDebug } from "@/api/logger";
import normalizeNullsTopLevel from "@/api/oauth/normalizeNullsTopLevel";
import normalizeLinkedProviders from "@/api/provider/normalizeLinkedProviders";
import parseMaybeSingle from "@/api/supabase/parseMaybeSingle";
import { type ReadonlySupabaseClient } from "@/api/supabase/supabase-client";
import { UserSchema } from "@/shared/generated/supabaseSchemas";
import isRecordStringUnknown from "@/shared/utils/isRecordStringUnknown";
import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

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
export default function getUserByEmail({
	supabase,
	email,
}: GetUserByEmailParams): Effect.Effect<
	Schema.Schema.Type<typeof UserSchema> | undefined,
	DatabaseError
> {
	return Effect.gen(function* getUserByEmailGen($) {
		// Best-effort debug logging (synchronous)
		yield* $(
			Effect.sync(() => {
				// Localized: debug-only server-side log
				serverDebug("[getUserByEmail] Looking up user by email:", email);
			}),
		);

		// Perform the Supabase query as a Promise and map any thrown error to DatabaseError.
		// Detect common network/DNS error patterns and provide a clearer message to
		// aid local development debugging (e.g. workerd DNS lookup failures).
		const rawRes: unknown = yield* $(
			Effect.tryPromise<
				{
					data: unknown;
					error: unknown;
				},
				unknown
			>({
				try: () => supabase.from("user").select("*").eq("email", email).maybeSingle(),
				catch: (err) => err,
			}).pipe(
				Effect.mapError((err) => {
					const msg = getErrorMessage(err);
					const isDnsLike =
						/dns lookup failed|name or service not known|gai_strerror|DNS lookup failed/i.test(msg);
					if (isDnsLike) {
						// Dev-only: make the log explicit so it's easy to spot in local consoles
						serverDebug("[getUserByEmail] Detected network/DNS error contacting Supabase:", msg);
						return new DatabaseError({
							message: `Failed to contact Supabase (network/DNS error). Check VITE_SUPABASE_URL, network/DNS, and that the host is reachable. Original: ${msg}`,
						});
					}
					return new DatabaseError({ message: msg });
				}),
			),
		);

		const res = parseMaybeSingle(rawRes);

		// Debug: log the raw Supabase response data
		yield* $(
			Effect.sync(() => {
				// Localized: debug-only server-side log
				serverDebug("[getUserByEmail] Raw Supabase data:", res.data);
			}),
		);

		// Debug output to aid diagnosing preview vs production differences
		try {
			yield* $(
				Effect.sync(() => {
					function computeErrInfo(
						maybeErr: unknown,
					): { code: string | undefined; message: string | undefined } | undefined {
						if (maybeErr === null || maybeErr === undefined) {
							return undefined;
						}
						if (isRecordStringUnknown(maybeErr)) {
							const code = typeof maybeErr["code"] === "string" ? maybeErr["code"] : undefined;
							const message =
								typeof maybeErr["message"] === "string"
									? maybeErr["message"]
									: getErrorMessage(maybeErr["message"]);
							return { code, message };
						}
						return { code: undefined, message: getErrorMessage(maybeErr) };
					}

					const errInfo = computeErrInfo(res.error);
					// Localized: debug-only server-side log
					serverDebug("[getUserByEmail] Supabase response:", {
						status: res.status,
						error: errInfo,
						hasData: res.data !== undefined,
					});
				}),
			);
		} catch (error) {
			// don't fail the effect because logging failed
			yield* $(
				Effect.sync(() => {
					// Localized: debug-only server-side log
					serverDebug(
						"[getUserByEmail] Failed to stringify Supabase response",
						getErrorMessage(error),
					);
				}),
			);
		}

		// Handle PostgREST table-not-exists (e.g. PGRST205) as "not found"
		if (res.error !== undefined && res.error !== null) {
			try {
				const maybeErr = res.error;
				if (
					isRecordStringUnknown(maybeErr) &&
					typeof maybeErr["code"] === "string" &&
					maybeErr["code"] === "PGRST205"
				) {
					return undefined;
				}
			} catch {
				// fall through to throw below
			}
			// Map to DatabaseError
			return yield* $(Effect.fail(new DatabaseError({ message: getErrorMessage(res.error) })));
		}

		if (res.data === undefined || res.data === null) {
			return undefined;
		}

		// Normalize nulls -> undefined for optional top-level fields
		const sanitized = normalizeNullsTopLevel(res.data);

		// Validate against generated schema (may throw) and map failures.
		// Perform decoding and normalization in a single try/catch so we can
		// return a DatabaseError on any validation problem while avoiding
		// uninitialized declarations.
		try {
			const validatedLocal: Schema.Schema.Type<typeof UserSchema> = decodeUnknownSyncOrThrow(
				UserSchema,
				sanitized,
			);

			// Normalize linked_providers at runtime; failures fall back to [] and
			// are logged for debugging.
			let normalizedProviders: string[] = [];
			try {
				normalizedProviders = normalizeLinkedProviders(validatedLocal);
			} catch (error) {
				yield* $(
					Effect.sync(() => {
						// Localized: debug-only server-side log
						serverDebug(
							"[getUserByEmail] Failed to normalize linked_providers at runtime:",
							getErrorMessage(error),
						);
					}),
				);
				normalizedProviders = [];
			}

			// Merge the runtime-normalized providers onto the validated user
			// into a fresh, typed record and validate the merged result before returning.
			const mergedRecord: Record<string, unknown> = {};
			for (const key of Object.keys(validatedLocal as Record<string, unknown>)) {
				mergedRecord[key] = (validatedLocal as Record<string, unknown>)[key];
			}
			mergedRecord.linked_providers = normalizedProviders;
			const finalUserLocal = decodeUnknownSyncOrThrow(UserSchema, mergedRecord as unknown);
			return finalUserLocal;
		} catch (error) {
			return yield* $(Effect.fail(new DatabaseError({ message: getErrorMessage(error) })));
		}
	});
}
