// Prefer per-line console exceptions
import { Effect } from "effect";

import { clientDebug } from "@/react/utils/clientLogger";

import { type ApiResponseAction } from "./ApiResponseAction";
import createApiResponseEffect from "./createApiResponseEffect";

/**
 * Create an Effect that handles API response with side effect callbacks
 *
 * @param params - Handler parameters
 * @returns Effect resolving to `true` on success and `false` on handled failures
 */
export default function createApiResponseHandlerEffect({
	response,
	setValidationErrors,
	setSubmitError,
	defaultErrorMessage,
}: {
	readonly response: Response;
	readonly setValidationErrors: (
		errors: readonly { readonly field: string; readonly message: string }[],
	) => void;
	readonly setSubmitError: (error: string) => void;
	readonly defaultErrorMessage?: string;
}): Effect.Effect<boolean> {
	return createApiResponseEffect(response).pipe(
		Effect.matchEffect({
			onSuccess: () => {
				// Localized debug-only log
				clientDebug("🎯 API response success");
				return Effect.succeed(true);
			},
			onFailure: (action: Readonly<ApiResponseAction>) => {
				// Localized debug-only log
				clientDebug("💥 API response failure action:", action);
				if (action.type === "setFieldError") {
					// Localized debug-only log
					clientDebug("📝 Setting field error:", action.field, action.message);
					setValidationErrors([
						{
							field: action.field,
							message: action.message,
						},
					]);
				} else {
					// Use default error message if the action message is the generic fallback and a default is provided
					const errorMessage =
						action.message === "An error occurred" && defaultErrorMessage !== undefined
							? defaultErrorMessage
							: action.message;
					// Localized debug-only log
					clientDebug("🚨 Setting submit error:", errorMessage);
					setSubmitError(errorMessage);
				}
				return Effect.succeed(false);
			},
		}),
	);
}
