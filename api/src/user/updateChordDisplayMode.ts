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
import { ChordDisplayCategorySchema } from "@/shared/user/chord-display/chordDisplayCategory";
import { ChordLetterDisplaySchema } from "@/shared/user/chordLetterDisplay";
import { ChordScaleDegreeDisplaySchema } from "@/shared/user/chordScaleDegreeDisplay";
import decodeUnknownEffectOrMap from "@/shared/validation/decodeUnknownEffectOrMap";

const SESSION_COOKIE_MAX_AGE_SECONDS = 604_800;

const UpdateChordDisplayModeRequestSchema: Schema.Schema<{
	chordDisplayCategory: Schema.Schema.Type<typeof ChordDisplayCategorySchema>;
	chordLetterDisplay: Schema.Schema.Type<typeof ChordLetterDisplaySchema>;
	chordScaleDegreeDisplay: Schema.Schema.Type<typeof ChordScaleDegreeDisplaySchema>;
}> = Schema.Struct({
	chordDisplayCategory: ChordDisplayCategorySchema,
	chordLetterDisplay: ChordLetterDisplaySchema,
	chordScaleDegreeDisplay: ChordScaleDegreeDisplaySchema,
});

type UpdateChordDisplayModeRequest = Schema.Schema.Type<typeof UpdateChordDisplayModeRequestSchema>;

/**
 * Persists the user's chord display preferences and refreshes the session cookie payload.
 *
 * @param ctx - Read-only Hono request context
 * @returns Effect that validates, stores, and returns the saved chord display preferences
 */
export default function updateChordDisplayMode(ctx: ReadonlyContext): Effect.Effect<
	{
		chordDisplayCategory: UpdateChordDisplayModeRequest["chordDisplayCategory"];
		chordLetterDisplay: UpdateChordDisplayModeRequest["chordLetterDisplay"];
		chordScaleDegreeDisplay: UpdateChordDisplayModeRequest["chordScaleDegreeDisplay"];
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
							chord_display_category: request.chordDisplayCategory,
							chord_letter_display: request.chordLetterDisplay,
							chord_scale_degree_display: request.chordScaleDegreeDisplay,
						})
						.eq("user_id", userSession.user.user_id),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to update chord display preferences"),
					}),
			}),
		);

		if (updateResult.error !== null) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(
							updateResult.error,
							"Failed to update chord display preferences",
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
					chord_display_category: request.chordDisplayCategory,
					chord_letter_display: request.chordLetterDisplay,
					chord_scale_degree_display: request.chordScaleDegreeDisplay,
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
			chordDisplayCategory: request.chordDisplayCategory,
			chordLetterDisplay: request.chordLetterDisplay,
			chordScaleDegreeDisplay: request.chordScaleDegreeDisplay,
		};
	});
}
