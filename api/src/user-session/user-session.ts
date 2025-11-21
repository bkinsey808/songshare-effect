import type { ReadonlyUser } from "../user/user";
import type { Env } from "@/api/env";
import type { ReadonlyContext } from "@/api/hono/hono-context";
import type { ReadonlySupabaseClient } from "@/api/supabase/supabase-client";
import type { ReadonlyOauthState } from "@/shared/oauth/oauthState";
import type { ReadonlyOauthUserData } from "@/shared/oauth/oauthUserData";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

// Avoid deep-readonly for `ctx` because the Hono `Context` type has
// complex ambient types (e.g., arrays of matched routes) where making
// everything readonly produces incompatible shapes when passed into
// helpers that expect the Hono `Context` type wrapped with shallow
// `Readonly`.
export type BuildUserSessionJwtParams = ReadonlyDeep<{
	readonly supabase: ReadonlySupabaseClient;
	readonly existingUser: ReadonlyUser;
	readonly oauthUserData: ReadonlyOauthUserData;
	readonly oauthState: ReadonlyOauthState;
}> & { readonly ctx: ReadonlyContext<{ Bindings: Env }> };
