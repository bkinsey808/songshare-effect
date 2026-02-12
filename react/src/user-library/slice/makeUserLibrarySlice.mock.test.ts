import { describe, expect, it } from "vitest";

import makeUserLibraryEntry from "@/react/user-library/test-utils/makeUserLibraryEntry.mock";

import type { UserLibraryEntry } from "./user-library-types";

import makeUserLibrarySlice from "./makeUserLibrarySlice.mock";

describe("makeUserLibrarySlice", () => {
	it("reflects initial entries and setters update state", () => {
		const initial: Record<string, UserLibraryEntry> = {
			f1: makeUserLibraryEntry({
				user_id: "u1",
				followed_user_id: "f1",
				created_at: "t",
				owner_username: "owner",
			}),
		};
		const get = makeUserLibrarySlice(initial);
		const slice = get();

		expect(slice.userLibraryEntries).toStrictEqual(initial);

		slice.setUserLibraryEntries({});
		expect(slice.userLibraryEntries).toStrictEqual({});

		slice.setUserLibraryError("err");
		expect(slice.userLibraryError).toBe("err");

		slice.setUserLibraryLoading(true);
		expect(slice.isUserLibraryLoading).toBe(true);
	});

	it("add and remove mutate state and isInUserLibrary reflects changes", () => {
		const get = makeUserLibrarySlice();
		const slice = get();

		const entry = makeUserLibraryEntry({
			user_id: "u2",
			followed_user_id: "f2",
			created_at: "t",
			owner_username: "o",
		});

		slice.addUserLibraryEntry(entry);
		expect(slice.isInUserLibrary("f2")).toBe(true);
		expect(slice.userLibraryEntries["f2"]).toStrictEqual(entry);

		slice.removeUserLibraryEntry("f2");
		expect(slice.isInUserLibrary("f2")).toBe(false);
	});

	it("exposes vi.fn spies for actions", () => {
		const get = makeUserLibrarySlice();
		const slice = get();

		slice.addUserLibraryEntry(
			makeUserLibraryEntry({
				user_id: "u3",
				followed_user_id: "f3",
				created_at: "t",
				owner_username: "o",
			}),
		);
		expect(slice.addUserLibraryEntry).toHaveBeenCalledWith(
			expect.objectContaining({ followed_user_id: "f3" }),
		);
	});
});
