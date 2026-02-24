import type { Effect } from "effect";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import { sliceResetFns } from "@/react/app-store/slice-reset-fns";

import type {
	AddUserToLibraryRequest,
	RemoveUserFromLibraryRequest,
	UserLibraryEntry,
	UserLibraryState,
} from "./user-library-types";
import type { UserLibrarySlice } from "./UserLibrarySlice.type";

import fetchUserLibraryFn from "../fetch/fetchUserLibraryEffect";
import subscribeToUserLibraryFn from "../subscribe/subscribeToUserLibraryEffect";
import subscribeToUserPublicForLibraryFn from "../subscribe/subscribeToUserPublicForLibraryEffect";
import addUserToLibraryFn from "../user-add/addUserToLibraryEffect";
import removeUserFromLibraryFn from "../user-remove/removeUserFromLibraryEffect";

const initialState: UserLibraryState = {
	userLibraryEntries: {} as Record<string, UserLibraryEntry>,
	isUserLibraryLoading: false,
	userLibraryError: undefined,
};

/**
 * Factory that creates the Zustand slice for user library state and actions.
 * The returned slice exposes Effects for fetching, subscribing, and mutating
 * the library, as well as local setters used by those Effects.
 *
 * @param set - Zustand `set` function for updating slice state.
 * @param get - Zustand `get` function for reading slice state.
 * @param api - Optional api helpers (currently unused).
 * @returns - The fully constructed `UserLibrarySlice`.
 */
export default function createUserLibrarySlice(
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

		subscribeToUserLibrary: (): Effect.Effect<() => void, Error> => subscribeToUserLibraryFn(get),

		subscribeToUserPublicForLibrary: (): Effect.Effect<() => void, Error> =>
			subscribeToUserPublicForLibraryFn(get),

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
