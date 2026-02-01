import isRecord from "@/shared/type-guards/isRecord";

import type { UserLibraryEntry } from "../user-library-types";

export function isUserLibraryEntry(value: unknown): value is UserLibraryEntry {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value["user_id"] === "string" &&
		typeof value["followed_user_id"] === "string" &&
		typeof value["created_at"] === "string"
	);
}

export default function guardAsUserLibraryEntry(input: unknown, where = "value"): UserLibraryEntry {
	if (!isUserLibraryEntry(input)) {
		throw new TypeError(`${where} must be a valid UserLibraryEntry`);
	}
	return input;
}
