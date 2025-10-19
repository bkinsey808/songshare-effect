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

	// Normalize null values to undefined for optional DB columns. Supabase
	// returns `null` for SQL NULL which will fail the Effect Schema validation
	// when the schema expects `string | undefined`. Convert null -> undefined
	// recursively so optional nested fields are handled too.
	const normalizeNulls = (v: unknown): unknown => {
		if (v === null) return undefined;
		if (Array.isArray(v)) return v.map(normalizeNulls);
		if (typeof v === "object" && v !== null) {
			const obj = v as Record<string, unknown>;
			const out: Record<string, unknown> = {};
			for (const k of Object.keys(obj)) {
				out[k] = normalizeNulls(obj[k]);
			}
			return out;
		}
		return v;
	};

	const sanitized = normalizeNulls(res.data);

	// Validate the returned row against the generated UserSchema so callers
	// receive the exact shape expected by session creation. The generator now
	// emits `linked_providers` as an array type where appropriate, so validate
	// the sanitized object directly.
	const validated = Schema.decodeUnknownSync(UserSchema)(sanitized as unknown);

	// Normalize `linked_providers` into a runtime string[] for easier usage
	// across the app. If the validated value is a string, split on commas.
	// If it's already an array-like value (unexpected), coerce to strings.
	const runtimeUser = { ...validated } as Record<string, unknown>;
	try {
		const lpRaw = (validated as any).linked_providers;
		if (Array.isArray(lpRaw)) {
			runtimeUser.linked_providers = lpRaw.map((x: unknown) => (x === null ? "" : String(x))).filter(Boolean);
		} else if (typeof lpRaw === "string") {
			// still handle legacy case where a CSV string might be present
			runtimeUser.linked_providers = lpRaw
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
		} else {
			runtimeUser.linked_providers = [];
		}
	} catch (err) {
		console.log("[getUserByEmail] Failed to normalize linked_providers at runtime:", String(err));
		runtimeUser.linked_providers = [];
	}

	// Cast back to the declared return type to minimize upstream changes —
	// runtime shape now contains `linked_providers: string[]` which callers
	// like `oauthCallback` can work with (e.g. using Array.includes).
	return runtimeUser as unknown as Schema.Schema.Type<typeof UserSchema>;
}
