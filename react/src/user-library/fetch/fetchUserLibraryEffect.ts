import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import isRecord from "@/shared/type-guards/isRecord";

import type { UserLibrary, UserLibraryEntry } from "../slice/user-library-types";
import type { UserLibrarySlice } from "../slice/UserLibrarySlice.type";

import isUserLibraryEntry from "../guards/isUserLibraryEntry";

/**
 * Fetches the current user's library from Supabase, joins owner username
 * information, and populates the slice with validated entries. Manages
 * loading and error state on the slice and logs diagnostic information.
 *
 * @param get - Getter for the `UserLibrarySlice` used to set state.
 * @returns - An Effect that resolves when fetching and setting complete or
 *   fails with an Error.
 */
export default function fetchUserLibraryEffect(
	get: () => UserLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* fetchUserLibraryGen($) {
		const { setUserLibraryEntries, setUserLibraryLoading, setUserLibraryError } = get();

		yield* $(
			Effect.sync(() => {
				console.warn("[fetchUserLibrary] Starting fetch...");
				setUserLibraryLoading(true);
				setUserLibraryError(undefined);
			}),
		);

		const userToken = yield* $(
			Effect.tryPromise({
				try: () => getSupabaseAuthToken(),
				catch: (err) => new Error(String(err)),
			}),
		);

		const client = getSupabaseClient(userToken);
		if (!client) {
			return yield* $(Effect.fail(new Error("No Supabase client available")));
		}

		const libraryQueryRes = yield* $(
			Effect.tryPromise({
				try: async () => {
					const res = await callSelect(client, "user_library", { cols: "*" });
					console.warn("[fetchUserLibrary] Query result:", JSON.stringify(res));
					return res;
				},
				catch: (err) => new Error(String(err)),
			}),
		);

		if (!isRecord(libraryQueryRes)) {
			return yield* $(
				Effect.fail(new Error("Invalid response from Supabase fetching user_library")),
			);
		}

		const libraryData: unknown[] = Array.isArray(libraryQueryRes["data"])
			? libraryQueryRes["data"]
			: [];

		const filteredEntriesArray = libraryData.filter((entry: unknown): entry is UserLibrary => {
			const isValid = isUserLibraryEntry(entry);
			if (!isValid) {
				console.warn("[fetchUserLibrary] Row failed type guard:", JSON.stringify(entry));
			}
			return isValid;
		});

		const ownerIds = [...new Set(filteredEntriesArray.map((entry) => entry.followed_user_id))];

		const rawOwnerResult = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "user_public", {
						cols: "user_id, username",
						in: { col: "user_id", vals: ownerIds },
					}),
				catch: (err) => new Error(String(err)),
			}),
		);

		if (!isRecord(rawOwnerResult)) {
			return yield* $(
				Effect.fail(new Error("Invalid response from Supabase fetching user_public")),
			);
		}

		const ownerData = Array.isArray(rawOwnerResult["data"]) ? rawOwnerResult["data"] : [];

		const ownerArray = (ownerData ?? []).filter(
			(ownerItem: unknown): ownerItem is { user_id: string; username: string } =>
				isRecord(ownerItem) &&
				typeof ownerItem["user_id"] === "string" &&
				typeof ownerItem["username"] === "string",
		);

		const ownerMap = new Map(ownerArray.map((owner) => [owner.user_id, owner.username]));

		const entriesRecord = filteredEntriesArray.reduce<Record<string, UserLibraryEntry>>(
			(acc, entry) => {
				const ownerUsername: string | undefined = ownerMap.get(entry.followed_user_id);
				const libraryEntry: UserLibraryEntry = {
					...entry,
					...(ownerUsername !== undefined && { owner_username: ownerUsername }),
				};
				acc[entry.followed_user_id] = libraryEntry;
				return acc;
			},
			{},
		);

		yield* $(
			Effect.sync(() => {
				const indent = 2;
				console.warn(
					`[fetchUserLibrary] Applying ${Object.keys(entriesRecord).length} entries to store:`,
					JSON.stringify(entriesRecord, undefined, indent),
				);
				setUserLibraryEntries(entriesRecord);
			}),
		);

		console.warn("[fetchUserLibrary] Complete.");
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setUserLibraryLoading, setUserLibraryError } = get();
				setUserLibraryLoading(false);
				setUserLibraryError("Failed to fetch user library");
				console.error("[fetchUserLibrary] Error:", err);
			}),
		),
		Effect.ensuring(
			Effect.sync(() => {
				const { setUserLibraryLoading } = get();
				console.warn("[fetchUserLibrary] Setting loading to false in ensuring");
				setUserLibraryLoading(false);
			}),
		),
	);
}
