// Types for User Library functionality (merged from user-library schema)

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
