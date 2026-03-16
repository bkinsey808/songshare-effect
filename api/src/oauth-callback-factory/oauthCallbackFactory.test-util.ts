/**
 * Test helpers for oauthCallbackFactory tests.
 */
import type { Schema } from "effect";

import type { ReadonlySupabaseClient } from "@/api/supabase/ReadonlySupabaseClient.type";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { UserSchema } from "@/shared/generated/supabaseSchemas";
import type { OauthState } from "@/shared/oauth/oauthState";
import type { OauthUserData } from "@/shared/oauth/oauthUserData";

export type FetchUserResult = {
	supabase: ReadonlySupabaseClient;
	oauthUserData: OauthUserData;
	existingUser: Schema.Schema.Type<typeof UserSchema> | undefined;
};

export function asOauthState(val: unknown): OauthState {
	return forceCast<OauthState>(val);
}

export function asFetchUserResult(val: unknown): FetchUserResult {
	return forceCast<FetchUserResult>(val);
}

export function asString(val: unknown): string {
	return forceCast<string>(val);
}
