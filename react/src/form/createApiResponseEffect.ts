// Prefer per-line console exceptions
import { Effect } from "effect";

import { clientDebug } from "@/react/lib/utils/clientLogger";

import { type ApiResponseAction } from "./ApiResponseAction.type";

/**
 * Create an Effect that handles API response parsing and returns structured actions
 *
 * @param response - Fetch `Response` to parse
 * @returns Effect that yields `success` on OK responses or fails with `ApiResponseAction` describing the error
 */
export default function createApiResponseEffect(
	response: Response,
): Effect.Effect<unknown, ApiResponseAction> {
	return Effect.gen(function* createApiResponseEffect() {
		// Localized debug-only log
		clientDebug("🔍 Processing API response, status:", response.status);
		// Success case
		if (response.ok) {
			// Localized debug-only log
			clientDebug("✅ Response is OK");
			return { type: "success" } as const;
		}

		// Localized debug-only log
		clientDebug("❌ Response not OK, parsing error");
		// Parse JSON with error handling
		let errorData: { error?: string | undefined; field?: string | undefined } = {
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
			// Localized debug-only log
			clientDebug("📄 Parsed error data:", errorData);
		} catch {
			// Localized debug-only log
			clientDebug("💥 Failed to parse JSON response");
			errorData = { error: "Invalid response from server" };
		}

		// Field-specific error
		if (
			typeof errorData.field === "string" &&
			errorData.field !== "" &&
			typeof errorData.error === "string" &&
			errorData.error !== ""
		) {
			// Localized debug-only log
			clientDebug("🎯 Field-specific error detected");
			return yield* Effect.fail({
				type: "setFieldError",
				field: errorData.field,
				message: errorData.error,
			} as const);
		}

		// General error
		// Localized debug-only log
		clientDebug("🚨 General error detected");
		return yield* Effect.fail({
			type: "setGeneralError",
			message: errorData.error ?? "An error occurred",
		} as const);
	});
}
