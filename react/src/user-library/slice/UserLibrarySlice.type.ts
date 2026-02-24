import type { Effect } from "effect";

import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import type {
	AddUserToLibraryRequest,
	RemoveUserFromLibraryRequest,
	UserLibraryEntry,
	UserLibrarySliceBase,
	UserLibraryState,
} from "./user-library-types";

export type UserLibrarySlice = UserLibraryState &
	UserLibrarySliceBase & {
		addUserToLibrary: (request: Readonly<AddUserToLibraryRequest>) => Effect.Effect<void, Error>;
		removeUserFromLibrary: (
			request: Readonly<RemoveUserFromLibraryRequest>,
		) => Effect.Effect<void, Error>;
		getUserLibraryIds: () => string[];
		fetchUserLibrary: () => Effect.Effect<void, Error>;
		subscribeToUserLibrary: () => Effect.Effect<() => void, Error>;
		subscribeToUserPublicForLibrary: () => Effect.Effect<() => void, Error>;
		userLibraryUnsubscribe?: () => void;
		setUserLibraryEntries: (entries: ReadonlyDeep<Record<string, UserLibraryEntry>>) => void;
		setUserLibraryLoading: (loading: boolean) => void;
		setUserLibraryError: (error: string | undefined) => void;
		addUserLibraryEntry: (entry: UserLibraryEntry) => void;
		removeUserLibraryEntry: (followedUserId: string) => void;
	};
