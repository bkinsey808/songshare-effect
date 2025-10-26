import { Effect } from "effect";

/**
 * Actions that can result from API response processing
 */
export type ApiResponseAction =
	| { type: "setFieldError"; field: string; message: string }
	| { type: "setGeneralError"; message: string };

/**
 * Create an Effect that handles API response parsing and returns structured actions
 */
export const createApiResponseEffect = (
	response: Response,
): Effect.Effect<{ type: "success" }, ApiResponseAction> => {
	return Effect.gen(function* () {
		console.log("🔍 Processing API response, status:", response.status);
		// Success case
		if (response.ok) {
			console.log("✅ Response is OK");
			return { type: "success" } as const;
		}

		console.log("❌ Response not OK, parsing error");
		// Parse JSON with error handling
		let errorData: { error?: string; field?: string };
		try {
			errorData = yield* Effect.promise(
				() => response.json() as Promise<{ error?: string; field?: string }>,
			);
			console.log("📄 Parsed error data:", errorData);
		} catch {
			console.log("💥 Failed to parse JSON response");
			errorData = { error: "Invalid response from server" };
		}

		// Field-specific error
		if (
			typeof errorData.field === "string" &&
			errorData.field.length > 0 &&
			typeof errorData.error === "string" &&
			errorData.error.length > 0
		) {
			console.log("🎯 Field-specific error detected");
			return yield* Effect.fail({
				type: "setFieldError",
				field: errorData.field,
				message: errorData.error,
			} as const);
		}

		// General error
		console.log("🚨 General error detected");
		return yield* Effect.fail({
			type: "setGeneralError",
			message: errorData.error ?? "An error occurred",
		} as const);
	});
};

/**
 * Create an Effect that handles API response with side effect callbacks
 */
export const createApiResponseHandler = (
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
			onFailure: (action) => {
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
