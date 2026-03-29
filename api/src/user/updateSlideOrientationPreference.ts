import { Effect, Schema } from "effect";

import { type AuthenticationError, DatabaseError, ValidationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { SlideOrientationPreferenceSchema } from "@/shared/user/slideOrientationPreference";
import decodeUnknownEffectOrMap from "@/shared/validation/decodeUnknownEffectOrMap";

const UpdateSlideOrientationPreferenceRequestSchema: Schema.Schema<{
	slideOrientationPreference: Schema.Schema.Type<typeof SlideOrientationPreferenceSchema>;
}> = Schema.Struct({
	slideOrientationPreference: SlideOrientationPreferenceSchema,
});

type UpdateSlideOrientationPreferenceRequest = Schema.Schema.Type<
	typeof UpdateSlideOrientationPreferenceRequestSchema
>;

export default function updateSlideOrientationPreference(ctx: ReadonlyContext): Effect.Effect<
	{
		slideOrientationPreference: UpdateSlideOrientationPreferenceRequest["slideOrientationPreference"];
	},
	ValidationError | DatabaseError | AuthenticationError
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

		return {
			slideOrientationPreference: request.slideOrientationPreference,
		};
	});
}
