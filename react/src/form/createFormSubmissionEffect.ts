import { Effect } from "effect";

import { createApiResponseHandlerEffect } from "./createApiResponseHandlerEffect";

/**
 * Create an Effect that handles form submission with API response processing
 */
export const createFormSubmissionEffect = ({
	formData,
	apiEndpoint,
	setValidationErrors,
	setSubmitError,
}: {
	readonly formData: FormData;
	readonly apiEndpoint: string;
	readonly setValidationErrors: (
		errors: ReadonlyArray<{ readonly field: string; readonly message: string }>,
	) => void;
	readonly setSubmitError: (error: string) => void;
}): Effect.Effect<boolean, never, never> => {
	return Effect.gen(function* () {
		// Make the API request
		const response = yield* Effect.promise(() =>
			fetch(apiEndpoint, {
				method: "POST",
				body: formData,
			}),
		);

		// Handle the response
		const success = yield* createApiResponseHandlerEffect({
			response,
			setValidationErrors,
			setSubmitError,
		});

		return success;
	});
};
