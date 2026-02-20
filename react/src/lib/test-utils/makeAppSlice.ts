import { Effect } from "effect";
import { vi } from "vitest";

import type { AppSlice } from "@/react/app-store/AppSlice.type";
import type { UserSessionData } from "@/shared/userSessionData";

/**
 * Create a minimal, typed AppSlice usable in tests.
 *
 * The returned slice provides:
 * - spyable methods using `vi.fn` (`setIsSignedIn`, `signIn`, `signOut`, `setShowSignedInAlert`)
 * - sensible no-op defaults for commonly overridden helpers used in tests
 *   (e.g. `removeEventFromLibrary`, `addOrUpdatePrivateSongs`, `fetchPlaylist`)
 * - simple local state for `isSignedIn` and `userSessionData`
 *
 * Callers may pass a partial `overrides` object to replace specific fields
 * or methods for targeted test scenarios. The default is an empty object.
 *
 * @param overrides - Partial overrides for fields or methods of the slice
 * @returns AppSlice - a typed test double usable in unit tests
 */
export default function makeAppSlice(overrides: Partial<AppSlice> = {}): AppSlice {
	let _isSignedIn: boolean | undefined = undefined;
	let _userSessionData: UserSessionData | undefined = undefined;

	function setIsSignedInImpl(value?: boolean): void {
		_isSignedIn = value;
	}
	const setIsSignedIn = vi.fn((value?: boolean) => {
		setIsSignedInImpl(value);
	});

	const signIn = vi.fn((data: UserSessionData) => {
		_userSessionData = data;
		_isSignedIn = true;
	});

	const signOut = vi.fn(() => {
		_userSessionData = undefined;
		_isSignedIn = false;
	});

	const setShowSignedInAlert = vi.fn();

	// Common no-op defaults used across tests to avoid repetitive overrides.
	const removeEventFromLibrary = vi.fn(() => Effect.succeed(undefined));
	const removeUserFromLibrary = vi.fn(() => Effect.succeed(undefined));
	const removeSongFromSongLibrary = vi.fn(() => Effect.succeed(undefined));
	const addOrUpdatePrivateSongs = vi.fn();
	const fetchPlaylist = vi.fn(() => Effect.succeed(undefined));

	// Fetch / subscribe defaults used by many tests
	const fetchUserLibrary = vi.fn(() => Effect.succeed(undefined));
	const subscribeToUserLibrary = vi.fn(() => Effect.succeed(() => undefined));
	const subscribeToUserPublicForLibrary = vi.fn(() => Effect.succeed(() => undefined));

	const fetchSongLibrary = vi.fn(() => Effect.succeed(undefined));
	const subscribeToSongLibrary = vi.fn(() => Effect.succeed(() => undefined));
	const subscribeToSongPublic = vi.fn(() => Effect.succeed(() => undefined));

	const fetchEventLibrary = vi.fn(() => Effect.succeed(undefined));
	const subscribeToEventLibrary = vi.fn(() => Effect.succeed(() => undefined));
	const subscribeToEventPublicForLibrary = vi.fn(() => Effect.succeed(() => undefined));

	const fetchPlaylistLibrary = vi.fn(() => Effect.succeed(undefined));

	const base: Partial<AppSlice> = {
		isSignedIn: _isSignedIn,
		userSessionData: _userSessionData,
		showSignedInAlert: false,
		setIsSignedIn,
		signIn,
		signOut,
		setShowSignedInAlert,
		removeEventFromLibrary,
		removeUserFromLibrary,
		removeSongFromSongLibrary,
		addOrUpdatePrivateSongs,
		fetchPlaylist,
		fetchUserLibrary,
		subscribeToUserLibrary,
		subscribeToUserPublicForLibrary,
		fetchSongLibrary,
		subscribeToSongLibrary,
		subscribeToSongPublic,
		fetchEventLibrary,
		subscribeToEventLibrary,
		subscribeToEventPublicForLibrary,
		fetchPlaylistLibrary,
		// common entries / flags used by library hooks
		userLibraryEntries: {},
		songLibraryEntries: {},
		eventLibraryEntries: {},
		isUserLibraryLoading: false,
		isSongLibraryLoading: false,
		isEventLibraryLoading: false,
		userLibraryError: undefined,
		songLibraryError: undefined,
		eventLibraryError: undefined,
	};

	// Merge overrides into the base and cast through `unknown` to a typed
	// `AppSlice` for tests. This is a controlled assertion: callers supply a
	// `Partial<AppSlice>` and the runtime shape in tests is kept minimal.
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
	return {
		...base,
		...overrides,
	} as unknown as AppSlice;
}
