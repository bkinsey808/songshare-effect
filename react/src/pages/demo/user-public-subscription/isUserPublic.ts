import { type Tables } from "@/shared/generated/supabaseTypes";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

export type UserPublic = Tables<"user_public">;

export function isUserPublic(value: unknown): value is UserPublic {
	if (!isRecord(value)) {
		return false;
	}

	const { user_id: userId, username } = value;
	return isString(userId) && isString(username);
}
