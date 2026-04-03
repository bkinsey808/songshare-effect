import { Effect, Schema } from "effect";

import {
	type AuthenticationError,
	DatabaseError,
	type ServerError,
	ValidationError,
} from "@/api/api-errors";
import buildSessionCookie from "@/api/cookie/buildSessionCookie";
import { userSessionCookieName } from "@/api/cookie/cookie";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import buildUserSessionJwt from "@/api/user-session/buildUserSessionJwt";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { ChordDisplayModeSchema } from "@/shared/user/chordDisplayMode";
import decodeUnknownEffectOrMap from "@/shared/validation/decodeUnknownEffectOrMap";

const SESSION_COOKIE_MAX_AGE_SECONDS = 604_800;

const UpdateChordDisplayModeRequestSchema: Schema.Schema<{
	chordDisplayMode: Schema.Schema.Type<typeof ChordDisplayModeSchema>;
}> = Schema.Struct({
	chordDisplayMode: ChordDisplayModeSchema,
});

type UpdateChordDisplayModeRequest = Schema.Schema.Type<typeof UpdateChordDisplayModeRequestSchema>;

export default function updateChordDisplayMode(ctx: ReadonlyContext): Effect.Effect<
	{
		chordDisplayMode: UpdateChordDisplayModeRequest["chordDisplayMode"];
	},
	ValidationError | DatabaseError | AuthenticationError | ServerError
> {
	return Effect.gen(function* updateChordDisplayModeGen($) {
		const body = yield* $(
			Effect.tryPromise({
				try: (): Promise<unknown> => ctx.req.json(),
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const request = yield* $(
			decodeUnknownEffectOrMap(
				UpdateChordDisplayModeRequestSchema,
				body,
				() => new ValidationError({ message: "Invalid chord display mode request" }),
			),
		);

		const userSession = yield* $(getVerifiedUserSession(ctx));
		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		const updateResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("user")
						.update({
							chord_display_mode: request.chordDisplayMode,
						})
						.eq("user_id", userSession.user.user_id),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to update chord display mode"),
					}),
			}),
		);

		if (updateResult.error !== null) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(updateResult.error, "Failed to update chord display mode"),
					}),
				),
			);
		}

		const sessionJwt = yield* $(
			buildUserSessionJwt({
				ctx,
				supabase: client,
				existingUser: {
					...userSession.user,
					chord_display_mode: request.chordDisplayMode,
				},
				oauthUserData: userSession.oauthUserData,
				oauthState: userSession.oauthState,
			}),
		);
		const cookieHeader = buildSessionCookie({
			ctx,
			name: userSessionCookieName,
			value: sessionJwt,
			opts: {
				maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
				httpOnly: true,
			},
		});
		ctx.res.headers.append("Set-Cookie", cookieHeader);

		return {
			chordDisplayMode: request.chordDisplayMode,
		};
	});
}
