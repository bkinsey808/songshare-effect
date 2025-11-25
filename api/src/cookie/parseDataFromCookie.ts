// src/features/server-utils/parseDataFromCookie.ts
import { Schema } from "effect";
// parseDataFromCookie is a helper that accepts a mutable Context; keep types the same
import { verify } from "hono/jwt";

// Env type not required when ctx is optional — ReadonlyContext default is sufficient
import type { ReadonlyContext } from "@/api/hono/hono-context";

import { decodeUnknownSyncOrThrow } from "@/shared/validation/decode-or-throw";

type ParseDataFromCookieParams<T, A extends boolean | undefined> = Readonly<{
	ctx?: ReadonlyContext;
	cookieName: string;
	schema: Schema.Schema<T, unknown>;
	debug?: boolean;
	allowMissing?: A;
}>;

// Conditional type for return value
type ParseCookieResult<T, A extends boolean | undefined> = A extends true
	? T | undefined
	: T;

export async function parseDataFromCookie<
	T,
	A extends boolean | undefined = false,
>({
	ctx,
	cookieName,
	schema,
	debug = false,
	allowMissing = false,
}: ParseDataFromCookieParams<T, A>): Promise<ParseCookieResult<T, A>> {
	if (!ctx) {
		throw new Error("Missing context when parsing data from cookie");
	}
	const cookieHeader = ctx.req.header("Cookie");
	const cookie = typeof cookieHeader === "string" ? cookieHeader : "";
	if (debug) {
		console.log("[parseDataFromCookie] Raw cookie:", cookie);
	}

	const re = new RegExp(`${cookieName}=([^;]+)`);
	const match = re.exec(cookie);
	const token =
		match && typeof match[1] === "string" && match[1] !== ""
			? match[1]
			: undefined;

	if (token === undefined || token === "") {
		if (allowMissing) {
			// Narrow, localized disable: returning `undefined` for the conditional generic
			// return type. This is a safe behavior at the API boundary.
			// Narrow, localized disable: returning `undefined` for the conditional generic
			// return type. This is a safe behavior at the API boundary.
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion
			return undefined as ParseCookieResult<T, A>;
		}
		throw new Error("Failed to extract token from cookie");
	}

	try {
		const jwtSecret = ctx.env.JWT_SECRET;
		if (jwtSecret === undefined || jwtSecret === "") {
			throw new Error("Missing JWT_SECRET in environment");
		}

		const verified = await verify(token, jwtSecret);
		if (debug) {
			console.log("[parseDataFromCookie] Verified JWT payload:", verified);
		}

		// Use the shared decode helper which throws on validation failure.
		const decoded = decodeUnknownSyncOrThrow(schema, verified);

		// If the decoded value is a record we can safely return it; otherwise it's a schema match
		// and the decode helper will have thrown. Keep TS happy by returning the decoded value.
		return decoded as ParseCookieResult<T, A>;
	} catch (err) {
		console.error(
			"[parseDataFromCookie] JWT verification or parsing error:",
			err,
		);
		if (allowMissing) {
			// Narrow, localized disable for the same conditional-return pattern.
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion
			return undefined as ParseCookieResult<T, A>;
		}
		throw new Error("Failed to parse data from cookie");
	}
}
