/* eslint-disable no-console */
import { Effect } from "effect";

import type { ApiResponseAction } from "./apiResponseTypes";

/**
 * Create an Effect that handles API response parsing and returns structured actions
 */
export function createApiResponseEffect(
	response: Response,
): Effect.Effect<unknown, ApiResponseAction> {
	return Effect.gen(function* createApiResponseEffect() {
		console.log("🔍 Processing API response, status:", response.status);
		// Success case
		if (response.ok) {
			console.log("✅ Response is OK");
			return { type: "success" } as const;
		}

		console.log("❌ Response not OK, parsing error");
		// Parse JSON with error handling
		let errorData: { error?: string | undefined; field?: string | undefined } =
			{
				error: undefined,
				field: undefined,
			};
		try {
			errorData = yield* Effect.promise(async () => {
				const raw: unknown = await response.json();
				if (typeof raw === "object" && raw !== null) {
					const obj = raw as { error?: unknown; field?: unknown };
					return {
						error: typeof obj.error === "string" ? obj.error : undefined,
						field: typeof obj.field === "string" ? obj.field : undefined,
					};
				}
				return { error: undefined, field: undefined };
			});
			console.log("📄 Parsed error data:", errorData);
		} catch {
			console.log("💥 Failed to parse JSON response");
			errorData = { error: "Invalid response from server" };
		}

		// Field-specific error
		if (
			typeof errorData.field === "string" &&
			errorData.field !== "" &&
			typeof errorData.error === "string" &&
			errorData.error !== ""
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
}
