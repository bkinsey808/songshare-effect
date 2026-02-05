import type { Effect } from "effect";

import type { Api, Get, Set } from "@/react/zustand/slice-utils";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import { sliceResetFns } from "@/react/zustand/slice-reset-fns";

import type {
	AddUserToLibraryRequest,
	RemoveUserFromLibraryRequest,
	UserLibraryEntry,
	UserLibrarySliceBase,
	UserLibraryState,
} from "./user-library-types";

import addUserToLibraryFn from "./addUserToLibrary";
import fetchUserLibraryFn from "./fetchUserLibrary";
import removeUserFromLibraryFn from "./removeUserFromLibrary";
import subscribeToUserLibraryFn from "./subscribe/subscribeToUserLibrary";

const initialState: UserLibraryState = {
	userLibraryEntries: {} as Record<string, UserLibraryEntry>,
	isUserLibraryLoading: false,
	userLibraryError: undefined,
};

export type UserLibrarySlice = UserLibraryState &
	UserLibrarySliceBase & {
		addUserToLibrary: (request: Readonly<AddUserToLibraryRequest>) => Effect.Effect<void, Error>;
		removeUserFromLibrary: (
			request: Readonly<RemoveUserFromLibraryRequest>,
		) => Effect.Effect<void, Error>;
		getUserLibraryIds: () => string[];
		fetchUserLibrary: () => Effect.Effect<void, Error>;
		subscribeToUserLibrary: () => Effect.Effect<() => void, Error>;
		userLibraryUnsubscribe?: () => void;
		setUserLibraryEntries: (entries: ReadonlyDeep<Record<string, UserLibraryEntry>>) => void;
		setUserLibraryLoading: (loading: boolean) => void;
		setUserLibraryError: (error: string | undefined) => void;
		addUserLibraryEntry: (entry: UserLibraryEntry) => void;
		removeUserLibraryEntry: (followedUserId: string) => void;
	};

/**
 * createUserLibrarySlice
 *
 * Factory that creates the Zustand slice for user library state and actions.
 * The returned slice exposes Effects for fetching, subscribing, and mutating
 * the library, as well as local setters used by those Effects.
 *
 * @param set - Zustand `set` function for updating slice state.
 * @param get - Zustand `get` function for reading slice state.
 * @param api - Optional api helpers (currently unused).
 * @returns - The fully constructed `UserLibrarySlice`.
 */
export function createUserLibrarySlice(
	set: Set<UserLibrarySlice>,
	get: Get<UserLibrarySlice>,
	api: Api<UserLibrarySlice>,
): UserLibrarySlice {
	void api;
	sliceResetFns.add(() => {
		const { userLibraryUnsubscribe } = get();
		if (userLibraryUnsubscribe) {
			userLibraryUnsubscribe();
		}
		set(initialState);
	});

	return {
		...initialState,

		addUserToLibrary: (request: Readonly<AddUserToLibraryRequest>) =>
			addUserToLibraryFn(request, get),
		removeUserFromLibrary: (request: Readonly<RemoveUserFromLibraryRequest>) =>
			removeUserFromLibraryFn(request, get),

		isInUserLibrary: (followedUserId: string) => {
			const { userLibraryEntries } = get();
			return followedUserId in userLibraryEntries;
		},

		getUserLibraryIds: () => {
			const { userLibraryEntries } = get();
			return Object.keys(userLibraryEntries);
		},

		fetchUserLibrary: () => fetchUserLibraryFn(get),

		subscribeToUserLibrary: () => subscribeToUserLibraryFn(get),

		setUserLibraryEntries: (entries: ReadonlyDeep<Record<string, UserLibraryEntry>>) => {
			set({ userLibraryEntries: entries });
		},

		addUserLibraryEntry: (entry: UserLibraryEntry) => {
			set((state) => ({
				userLibraryEntries: {
					...state.userLibraryEntries,
					[entry.followed_user_id]: entry,
				},
			}));
		},

		removeUserLibraryEntry: (followedUserId: string) => {
			set((state) => {
				const newEntries = Object.fromEntries(
					Object.entries(state.userLibraryEntries).filter(([id]) => id !== followedUserId),
				);
				return { userLibraryEntries: newEntries };
			});
		},

		setUserLibraryLoading: (loading: boolean) => {
			set({ isUserLibraryLoading: loading });
		},

		setUserLibraryError: (error: string | undefined) => {
			set({ userLibraryError: error });
		},
	};
}
