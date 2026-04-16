import { Effect, Schema } from "effect";

import { type AuthenticationError, DatabaseError, type ServerError, ValidationError } from "@/api/api-errors";
import buildSessionCookie from "@/api/cookie/buildSessionCookie";
import { userSessionCookieName } from "@/api/cookie/cookie";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import buildUserSessionJwt from "@/api/user-session/buildUserSessionJwt";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { SlideOrientationPreferenceSchema } from "@/shared/user/slideOrientationPreference";
import decodeUnknownEffectOrMap from "@/shared/validation/decodeUnknownEffectOrMap";

const SESSION_COOKIE_MAX_AGE_SECONDS = 604_800;

const UpdateSlideOrientationPreferenceRequestSchema: Schema.Schema<{
	slideOrientationPreference: Schema.Schema.Type<typeof SlideOrientationPreferenceSchema>;
}> = Schema.Struct({
	slideOrientationPreference: SlideOrientationPreferenceSchema,
});

type UpdateSlideOrientationPreferenceRequest = Schema.Schema.Type<
	typeof UpdateSlideOrientationPreferenceRequestSchema
>;

/**
 * Update the signed-in user's slide orientation preference and refresh session cookie.
 *
 * @param ctx - Hono request context containing env and request data
 * @returns Effect that yields the updated slideOrientationPreference and may fail with validation or database errors
 */
export default function updateSlideOrientationPreference(ctx: ReadonlyContext): Effect.Effect<
	{
		slideOrientationPreference: UpdateSlideOrientationPreferenceRequest["slideOrientationPreference"];
	},
	ValidationError | DatabaseError | AuthenticationError | ServerError
> {
	return Effect.gen(function* updateSlideOrientationPreferenceGen($) {
		const body = yield* $(
			Effect.tryPromise({
				try: (): Promise<unknown> => ctx.req.json(),
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const request = yield* $(
			decodeUnknownEffectOrMap(
				UpdateSlideOrientationPreferenceRequestSchema,
				body,
				() => new ValidationError({ message: "Invalid slide orientation preference request" }),
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
							slide_orientation_preference: request.slideOrientationPreference,
						})
						.eq("user_id", userSession.user.user_id),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to update slide orientation preference"),
					}),
			}),
		);

		if (updateResult.error !== null) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(
							updateResult.error,
							"Failed to update slide orientation preference",
						),
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
					slide_orientation_preference: request.slideOrientationPreference,
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
			slideOrientationPreference: request.slideOrientationPreference,
		};
	});
}
