import { type Tables } from "@/shared/generated/supabaseTypes";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

export type UserPublic = Tables<"user_public">;

/**
 * Type guard asserting an object is a `UserPublic` row.
 *
 * @param value - Value to check
 * @returns True when `value` matches the `UserPublic` shape
 */
export function isUserPublic(value: unknown): value is UserPublic {
	if (!isRecord(value)) {
		return false;
	}

	const { user_id: userId, username } = value;
	return isString(userId) && isString(username);
}
