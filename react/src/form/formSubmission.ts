import { Effect } from "effect";

import { createApiResponseHandler } from "./apiResponse";

/**
 * Create an Effect that handles form submission with API response processing
 */
export const createFormSubmissionEffect = (
	formData: FormData,
	apiEndpoint: string,
	setValidationErrors: (errors: { field: string; message: string }[]) => void,
	setSubmitError: (error: string) => void,
): Effect.Effect<boolean, never, never> => {
	return Effect.gen(function* () {
		// Make the API request
		const response = yield* Effect.promise(() =>
			fetch(apiEndpoint, {
				method: "POST",
				body: formData,
			}),
		);

		// Handle the response
		const success = yield* createApiResponseHandler(
			response,
			setValidationErrors,
			setSubmitError,
		);

		return success;
	});
};
