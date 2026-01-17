import type { Schema } from "effect";

import { verify } from "hono/jwt";

import { type ReadonlyContext } from "@/api/hono/hono-context";
import { log as serverLog, error as serverError } from "@/api/logger";
import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

type ParseDataFromCookieParams<
	SchemaT extends Schema.Schema.AnyNoContext,
	AllowMissing extends boolean | undefined,
> = Readonly<{
	ctx?: ReadonlyContext;
	cookieName: string;
	// Accept any Effect Schema and let the generic `SchemaT` carry the type info.
	schema: SchemaT;
	debug?: boolean;
	allowMissing?: AllowMissing;
}>;

// Conditional type for return value
// ParseCookieResult is no longer needed since we derive return types from
// the Schema generic parameter `SchemaT`.

// Overloads: when allowMissing is true the return includes undefined
export async function parseDataFromCookie<SchemaT extends Schema.Schema.AnyNoContext>(
	params: ParseDataFromCookieParams<SchemaT, true>,
): Promise<Schema.Schema.Type<SchemaT> | undefined>;
export async function parseDataFromCookie<SchemaT extends Schema.Schema.AnyNoContext>(
	params: ParseDataFromCookieParams<SchemaT, false>,
): Promise<Schema.Schema.Type<SchemaT>>;

export async function parseDataFromCookie<
	SchemaT extends Schema.Schema.AnyNoContext,
	AllowMissing extends boolean | undefined = false,
>(
	params: ParseDataFromCookieParams<SchemaT, AllowMissing>,
): Promise<Schema.Schema.Type<SchemaT> | undefined> {
	const { ctx, cookieName, schema, debug = false, allowMissing = false } = params;
	if (!ctx) {
		throw new Error("Missing context when parsing data from cookie");
	}
	const cookieHeader = ctx.req.header("Cookie");
	const cookie = typeof cookieHeader === "string" ? cookieHeader : "";
	if (debug) {
		serverLog("[parseDataFromCookie] Raw cookie:", cookie);
	}

	const re = new RegExp(`${cookieName}=([^;]+)`);
	const match = re.exec(cookie);
	const CAPTURE_GROUP_ONE = 1;
	const token =
		match && typeof match[CAPTURE_GROUP_ONE] === "string" && match[CAPTURE_GROUP_ONE] !== ""
			? match[CAPTURE_GROUP_ONE]
			: undefined;

	if (token === undefined || token === "") {
		if (allowMissing) {
			// When allowMissing is true the overload above ensures the
			// return type includes `undefined`, so we can return it directly
			// without needing an unsafe assertion.
			return undefined;
		}
		throw new Error("Failed to extract token from cookie");
	}

	try {
		const jwtSecret = ctx.env.JWT_SECRET;
		if (jwtSecret === undefined || jwtSecret === "") {
			throw new Error("Missing JWT_SECRET in environment");
		}

		// Hono's `verify` requires the alg/options param — tokens in this app use HS256
		const verified = await verify(token, jwtSecret, "HS256");
		if (debug) {
			serverLog("[parseDataFromCookie] Verified JWT payload:", verified);
		}

		// Use the shared decode helper which throws on validation failure.
		// The decode helper returns the typed schema result but the analyzer
		// may still treat this as `any` in complex generic scenarios. Keep a
		// narrow, localized exception for the assignment.
		// oxlint-disable-next-line typescript/no-unsafe-assignment
		const decoded = decodeUnknownSyncOrThrow(schema, verified);

		// If the decoded value is a record we can safely return it; otherwise it's a schema match
		// and the decode helper will have thrown. Keep TS happy by returning the decoded value.
		// The `decoded` value is typed by the schema but may be treated as
		// `any` by some rules — narrow the exception here for the return.
		// The `decoded` value is typed by the schema but may be treated as
		// `any` by some rules — narrow the exception here for the return.
		// oxlint-disable-next-line typescript/no-unsafe-return, typescript/no-unsafe-type-assertion
		return decoded as Schema.Schema.Type<SchemaT>;
	} catch (error) {
		serverError("[parseDataFromCookie] JWT verification or parsing error:", error);
		if (allowMissing) {
			// When decoding fails, allowMissing enables returning undefined
			// per the overloads defined above. Keep the return typed via
			// assertion to satisfy the implementation signature.
			return undefined;
		}
		throw new Error("Failed to parse data from cookie", { cause: error });
	}
}
