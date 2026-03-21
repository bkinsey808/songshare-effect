import forceCast from "@/react/lib/test-utils/forceCast";
import type { UserLibraryEntry } from "@/react/user-library/slice/user-library-types";

/**
 * Factory for creating mock UserLibraryEntry objects.
 * @param overrides - Optional property overrides.
 * @returns A mocked UserLibraryEntry.
 */
export default function makeUserLibraryEntry(
	overrides: Partial<UserLibraryEntry> = {},
): UserLibraryEntry {
	const now = new Date().toISOString();
	return forceCast<UserLibraryEntry>({
		user_id: "u1",
		followed_user_id: "f1",
		created_at: now,
		owner_username: overrides.owner_username ?? "owner_user",
		...overrides,
	});
}
