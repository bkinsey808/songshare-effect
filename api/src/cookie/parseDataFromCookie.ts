// src/features/server-utils/parseDataFromCookie.ts
import { Schema } from "effect";
import type { Context } from "hono";
import { verify } from "hono/jwt";

import type { Env } from "@/api/env";

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
}: Readonly<{
	ctx?: Context<{ Bindings: Env }>;
	cookieName: string;
	schema: Schema.Schema<T, unknown, never>;
	debug?: boolean;
	allowMissing?: A;
}>): Promise<ParseCookieResult<T, A>> {
	if (!ctx) {
		throw new Error("Missing context when parsing data from cookie");
	}
	const cookieHeader = ctx.req.header("Cookie");
	const cookie = typeof cookieHeader === "string" ? cookieHeader : "";
	if (debug) {
		// eslint-disable-next-line no-console
		console.log("[parseDataFromCookie] Raw cookie:", cookie);
	}

	// eslint-disable-next-line security/detect-non-literal-regexp
	const re = new RegExp(`${cookieName}=([^;]+)`);
	const match = re.exec(cookie);
	const token =
		match && typeof match[1] === "string" && match[1] !== ""
			? match[1]
			: undefined;

	if (token === undefined || token === "") {
		if (allowMissing) {
			return undefined as ParseCookieResult<T, A>;
		}
		throw new Error("Failed to extract token from cookie");
	}

	try {
		const jwtSecret = ctx.env.JWT_SECRET;
		if (jwtSecret === undefined || jwtSecret === "") {
			throw new Error("Missing JWT_SECRET in environment");
		}

		const verified = await verify(token, jwtSecret as string);
		if (debug) {
			// eslint-disable-next-line no-console
			console.log("[parseDataFromCookie] Verified JWT payload:", verified);
		}

		// Use Effect-TS Schema synchronous decode which throws on failure,
		// matching previous behavior where parse() would throw on invalid data.
		const decoded = Schema.decodeUnknownSync(schema)(verified);

		return decoded as ParseCookieResult<T, A>;
	} catch (err) {
		console.error(
			"[parseDataFromCookie] JWT verification or parsing error:",
			err,
		);
		if (allowMissing) {
			return undefined as ParseCookieResult<T, A>;
		}
		throw new Error("Failed to parse data from cookie");
	}
}
