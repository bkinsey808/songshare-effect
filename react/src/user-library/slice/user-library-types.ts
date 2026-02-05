/**
 * User library types
 *
 * Type definitions used by the User Library slice and helpers. These types
 * mirror the database schema for `user_library` and related public fields.
 */

export type UserLibrary = {
	user_id: string;
	followed_user_id: string;
	created_at: string;
};

export type UserLibraryEntry = UserLibrary & {
	owner_username?: string;
};

export type AddUserToLibraryRequest = {
	followed_user_id: string;
};

export type RemoveUserFromLibraryRequest = {
	followed_user_id: string;
};

export type UserLibraryState = {
	userLibraryEntries: Record<string, UserLibraryEntry>;
	isUserLibraryLoading: boolean;
	userLibraryError?: string | undefined;
};

export type UserLibrarySliceBase = {
	isInUserLibrary: (followedUserId: string) => boolean;
};
