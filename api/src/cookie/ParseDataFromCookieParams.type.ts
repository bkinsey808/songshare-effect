import type { Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

export type ParseDataFromCookieParams<
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
