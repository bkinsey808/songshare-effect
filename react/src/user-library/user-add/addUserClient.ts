import { Effect } from "effect";

import { getTypedState } from "@/react/app-store/useAppStore";

import addUserToLibraryEffect from "./addUserToLibraryEffect";

/**
 * addUserToLibraryClient
 *
 * Compatibility wrapper that calls the full `addUserToLibraryEffect` using the
 * global app store so existing call sites can continue to `await` the
 * operation by passing just a `followedUserId` string.
 *
 * @param followedUserId - The ID of the user to add to the library.
 * @returns - A Promise that resolves when the operation completes.
 */
export default async function addUserToLibraryClient(followedUserId: string): Promise<void> {
	await Effect.runPromise(
		addUserToLibraryEffect({ followed_user_id: followedUserId }, () => getTypedState()),
	);
}
