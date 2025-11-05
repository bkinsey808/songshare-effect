/* eslint-disable no-console */
import { Effect } from "effect";

import type { ApiResponseAction } from "./apiResponseTypes";

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
