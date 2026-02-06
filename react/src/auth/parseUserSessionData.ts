import isRecord from "@/shared/type-guards/isRecord";
import { type UserSessionData } from "@/shared/userSessionData";

/**
 * @param value - The value to check
 * @returns True if value is a success wrapper
 */
function isSuccessWrapper(
	value: unknown,
): value is { readonly success: true; readonly data: unknown } {
	if (!isRecord(value)) {
		return false;
	}
	return Object.hasOwn(value, "data") && value["data"] !== undefined;
}

/**
 * @param value - The value to check
 * @returns True if value is UserSessionData
 */
function isUserSessionData(value: unknown): value is UserSessionData {
	if (!isRecord(value)) {
		return false;
	}
	return Object.hasOwn(value, "user");
}

/**
 * Validate payload shape and return UserSessionData if valid, otherwise undefined.
 * Handles both raw UserSessionData and Hono-style success wrappers.
 *
 * @param payload - The raw payload to parse
 * @returns The parsed UserSessionData or undefined if invalid
 */
export default function parseUserSessionData(payload: unknown): UserSessionData | undefined {
	if (isSuccessWrapper(payload)) {
		const { data } = payload;
		if (isUserSessionData(data)) {
			return data;
		}
	}

	if (isUserSessionData(payload)) {
		return payload;
	}
	return undefined;
}
