import { type Schema, Effect } from "effect";

import { DatabaseError } from "@/api/api-errors";
import normalizeNullsTopLevel from "@/api/oauth/normalizeNullsTopLevel";
import normalizeLinkedProviders from "@/api/provider/normalizeLinkedProviders";
import parseMaybeSingle from "@/api/supabase/parseMaybeSingle";
import { type ReadonlySupabaseClient } from "@/api/supabase/ReadonlySupabaseClient.type";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { UserSchema } from "@/shared/generated/supabaseSchemas";
import isRecordStringUnknown from "@/shared/utils/isRecordStringUnknown";
import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

// Supabase response shape handled via `parseMaybeSingle`

type GetUserByEmailParams = Readonly<{
	supabase: Readonly<ReadonlySupabaseClient>;
	email: string;
}>;

/**
 * Lookup a user by email and return a validated user or `undefined` when not found.
 *
 * @param supabase - Supabase client used to query the DB
 * @param email - Email address to look up
 * @returns An Effect yielding the validated user object or `undefined`
 * @throws DatabaseError on unexpected Supabase failures
 */
export default function getUserByEmail({
	supabase,
	email,
}: GetUserByEmailParams): Effect.Effect<
	Schema.Schema.Type<typeof UserSchema> | undefined,
	DatabaseError
> {
	return Effect.gen(function* getUserByEmailGen($) {
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
					const msg = extractErrorMessage(err, "Unknown error");
					const isDnsLike =
						/dns lookup failed|name or service not known|gai_strerror|DNS lookup failed/i.test(msg);
					if (isDnsLike) {
						return new DatabaseError({
							message: `Failed to contact Supabase (network/DNS error). Check VITE_SUPABASE_URL, network/DNS, and that the host is reachable. Original: ${msg}`,
						});
					}
					return new DatabaseError({ message: msg });
				}),
			),
		);

		const res = parseMaybeSingle(rawRes);

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
			return yield* $(
				Effect.fail(
					new DatabaseError({ message: extractErrorMessage(res.error, "Unknown error") }),
				),
			);
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
			} catch {
				// Fall back to empty array
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
			return yield* $(
				Effect.fail(new DatabaseError({ message: extractErrorMessage(error, "Unknown error") })),
			);
		}
	});
}
