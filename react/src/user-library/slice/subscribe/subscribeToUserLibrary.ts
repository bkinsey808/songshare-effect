import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/supabase/subscription/realtime/createRealtimeSubscription";

import type { UserLibrarySlice } from "../user-library-slice";

import handleUserLibrarySubscribeEvent from "./handleUserLibrarySubscribeEvent";

export default function subscribeToUserLibrary(
	get: () => UserLibrarySlice,
): Effect.Effect<() => void, Error> {
	return Effect.gen(function* subscribeGen($) {
		const userToken = yield* $(
			Effect.tryPromise({
				try: () => Promise.resolve(getSupabaseAuthToken()),
				catch: (err) => new Error(String(err)),
			}),
		);

		const supabaseClient = getSupabaseClient(userToken);
		if (supabaseClient === undefined) {
			return yield* $(Effect.fail(new Error("No Supabase client available")));
		}

		const cleanup = createRealtimeSubscription({
			client: supabaseClient,
			tableName: "user_library",
			onEvent: (payload: unknown) => handleUserLibrarySubscribeEvent(payload, supabaseClient, get),
		});

		return (): void => {
			cleanup();
		};
	});
}
