/* eslint-disable no-console */
import { Effect } from "effect";

import type { ApiResponseAction } from "./apiResponseTypes";
import { createApiResponseEffect } from "./createApiResponseEffect";

/**
 * Create an Effect that handles API response with side effect callbacks
 */
export const createApiResponseHandlerEffect = (
	response: Response,
	setValidationErrors: (errors: { field: string; message: string }[]) => void,
	setSubmitError: (error: string) => void,
	defaultErrorMessage?: string,
): Effect.Effect<boolean, never, never> => {
	return createApiResponseEffect(response).pipe(
		Effect.matchEffect({
			onSuccess: () => {
				console.log("🎯 API response success");
				return Effect.succeed(true);
			},
			onFailure: (action: ApiResponseAction) => {
				console.log("💥 API response failure action:", action);
				if (action.type === "setFieldError") {
					console.log("📝 Setting field error:", action.field, action.message);
					setValidationErrors([
						{
							field: action.field,
							message: action.message,
						},
					]);
				} else {
					// Use default error message if the action message is the generic fallback and a default is provided
					const errorMessage =
						action.message === "An error occurred" &&
						defaultErrorMessage !== undefined
							? defaultErrorMessage
							: action.message;
					console.log("🚨 Setting submit error:", errorMessage);
					setSubmitError(errorMessage);
				}
				return Effect.succeed(false);
			},
		}),
	);
};
