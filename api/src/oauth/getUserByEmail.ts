/* eslint-disable no-console */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Schema } from "effect";

import { UserSchema } from "@/shared/generated/supabaseSchemas";

// Lookup a user by email using a Supabase client. Returns the validated user
// object or undefined if not found. Throws on unexpected errors so callers can map to 500.
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

	// Validate the returned row against the UserSchema so callers receive the
	// exact shape expected by session creation.
	const validated = Schema.decodeUnknownSync(UserSchema)(res.data as unknown);
	return validated;
}
