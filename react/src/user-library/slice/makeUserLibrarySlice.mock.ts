import { Effect } from "effect";
import { vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { UserLibraryEntry } from "./user-library-types";
import type { UserLibrarySlice } from "./UserLibrarySlice.type";

/**
 * Returns a getter for a minimal, test-friendly `UserLibrarySlice`.
 * The returned getter exposes stateful behavior for `setUserLibraryEntries`,
 * `addUserLibraryEntry`, and `removeUserLibraryEntry` so tests can assert
 * against `slice.userLibraryEntries` after actions run.
 */
export default function makeUserLibrarySlice(
	initialEntries: Record<string, UserLibraryEntry> = {},
): () => UserLibrarySlice {
	const state = {
		userLibraryEntries: initialEntries,
		isUserLibraryLoading: false,
		userLibraryError: undefined as string | undefined,
	};

	const setUserLibraryEntries = vi.fn((entries: Record<string, UserLibraryEntry>) => {
		state.userLibraryEntries = entries;
	});

	const setUserLibraryLoading = vi.fn((loading: boolean) => {
		state.isUserLibraryLoading = loading;
	});

	const setUserLibraryError = vi.fn((err?: string) => {
		state.userLibraryError = err;
	});

	const addUserLibraryEntry = vi.fn((entry: UserLibraryEntry) => {
		const key = (entry).followed_user_id;
		state.userLibraryEntries = forceCast<Record<string, UserLibraryEntry>>({
			...state.userLibraryEntries,
			[key]: entry,
		});
	});

	const removeUserLibraryEntry = vi.fn((id: string) => {
		const { [id]: _removed, ...rest } = state.userLibraryEntries;
		state.userLibraryEntries = forceCast<Record<string, UserLibraryEntry>>(rest);
	});

	const stub: unknown = {
		get userLibraryEntries(): Record<string, UserLibraryEntry> {
			return state.userLibraryEntries;
		},
		get isUserLibraryLoading(): boolean {
			return state.isUserLibraryLoading;
		},
		get userLibraryError(): string | undefined {
			return state.userLibraryError;
		},

		addUserToLibrary: (_req: unknown): unknown => ({}),
		removeUserFromLibrary: (_req: unknown): unknown => ({}),
		isInUserLibrary: (id: string): boolean => id in state.userLibraryEntries,
		getUserLibraryIds: (): string[] => Object.keys(state.userLibraryEntries),
		fetchUserLibrary: (): unknown => Effect.sync(() => undefined),
		subscribeToUserLibrary: (): unknown => Effect.sync(() => (): void => undefined),
		subscribeToUserPublicForLibrary: (): unknown => Effect.sync(() => (): void => undefined),
		setUserLibraryEntries,
		setUserLibraryLoading,
		setUserLibraryError,
		addUserLibraryEntry,
		removeUserLibraryEntry,
	};

	return () => forceCast<UserLibrarySlice>(stub);
}
