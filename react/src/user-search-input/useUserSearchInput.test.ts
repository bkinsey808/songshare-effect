import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import { makeChangeEvent, makeMouseEvent } from "@/react/lib/test-utils/dom-events";
import makeUserLibraryEntry from "@/react/user-library/test-utils/makeUserLibraryEntry.mock";

import useUserSearchInput from "./useUserSearchInput";

function requireDefined<Item>(
	value: Item | undefined,
	message = "Expected value to be defined",
): Item {
	if (value === undefined) {
		throw new Error(message);
	}
	return value;
}

describe("useUserSearchInput", () => {
	it("returns all users when query is empty", () => {
		const store: typeof useAppStore = useAppStore;
		const u1 = makeUserLibraryEntry({ followed_user_id: "f1", owner_username: "alice" });
		const u2 = makeUserLibraryEntry({ followed_user_id: "f2", owner_username: "bob" });
		store.setState((prev) => ({ ...prev, userLibraryEntries: { f1: u1, f2: u2 } }));

		const onSelect = vi.fn();
		const { result } = renderHook(() => useUserSearchInput({ activeUserId: undefined, onSelect }));

		expect(result.current.filteredUsers.map((entry) => entry.followed_user_id)).toStrictEqual([
			"f1",
			"f2",
		]);
		expect(result.current.searchQuery).toBe("");
		expect(result.current.isOpen).toBe(false);
	});

	it("filters users by username or id on input change and opens dropdown", async () => {
		const store: typeof useAppStore = useAppStore;
		const u1 = makeUserLibraryEntry({ followed_user_id: "f1", owner_username: "alice" });
		const u2 = makeUserLibraryEntry({ followed_user_id: "bob123", owner_username: "bobby" });
		store.setState((prev) => ({ ...prev, userLibraryEntries: { f1: u1, bob123: u2 } }));

		const onSelect = vi.fn();
		const { result } = renderHook(() => useUserSearchInput({ activeUserId: undefined, onSelect }));

		result.current.handleInputChange(makeChangeEvent("ali"));

		// search by id
		result.current.handleInputChange(makeChangeEvent("bob"));
		await waitFor(() => {
			expect(result.current.filteredUsers.map((entry) => entry.followed_user_id)).toStrictEqual([
				"bob123",
			]);
		});
	});

	it("treats empty username as missing when filtering", async () => {
		const store: typeof useAppStore = useAppStore;
		// user with blank username should still be found by id
		const u1 = makeUserLibraryEntry({ followed_user_id: "f1", owner_username: "" });
		store.setState((prev) => ({ ...prev, userLibraryEntries: { f1: u1 } }));

		const onSelect = vi.fn();
		const { result } = renderHook(() => useUserSearchInput({ activeUserId: undefined, onSelect }));

		// typing part of the id should match even though username is empty
		result.current.handleInputChange(makeChangeEvent("f1"));
		await waitFor(() => {
			expect(result.current.filteredUsers.map((entry) => entry.followed_user_id)).toStrictEqual(["f1"]);
		});
	});

	it("handleSelectUser calls onSelect and clears state", async () => {
		const EXPECTED_SINGLE = 1;
		const FIRST_INDEX = 0;

		const store = useAppStore;
		const u1 = makeUserLibraryEntry({ followed_user_id: "f1", owner_username: "alice" });
		const u2 = makeUserLibraryEntry({ followed_user_id: "f2", owner_username: "bob" });
		store.setState((prev) => ({ ...prev, userLibraryEntries: { f1: u1, f2: u2 } }));

		const onSelect = vi.fn();
		const { result } = renderHook(() => useUserSearchInput({ activeUserId: undefined, onSelect }));

		result.current.handleInputChange(makeChangeEvent("ali"));

		await waitFor(() => {
			expect(result.current.filteredUsers).toHaveLength(EXPECTED_SINGLE);
		});

		const selected = requireDefined(result.current.filteredUsers[FIRST_INDEX]);
		result.current.handleSelectUser(selected);

		await waitFor(() => {
			expect(onSelect).toHaveBeenCalledWith("f1");
			expect(result.current.searchQuery).toBe("");
			expect(result.current.isOpen).toBe(false);
		});
	});

	it("handleClearSelection calls onSelect with empty string and focuses input if present", () => {
		const store = useAppStore;
		const u1 = makeUserLibraryEntry({ followed_user_id: "f1", owner_username: "alice" });
		store.setState((prev) => ({ ...prev, userLibraryEntries: { f1: u1 } }));

		const onSelect = vi.fn();
		const { result } = renderHook(() => useUserSearchInput({ activeUserId: undefined, onSelect }));

		const input = document.createElement("input");
		const focusSpy = vi.spyOn(input, "focus");
		Reflect.set(result.current.inputRef, "current", input);

		const fakeEvent = makeMouseEvent();
		const preventSpy = vi.spyOn(fakeEvent, "preventDefault");
		result.current.handleClearSelection(fakeEvent);

		expect(preventSpy).toHaveBeenCalledWith();
		expect(onSelect).toHaveBeenCalledWith("");
		expect(result.current.searchQuery).toBe("");
		expect(result.current.isOpen).toBe(false);
		expect(focusSpy).toHaveBeenCalledWith();
	});

	it("inputDisplayValue shows active user's username when searchQuery is empty", () => {
		const store = useAppStore;
		const u1 = makeUserLibraryEntry({ followed_user_id: "f1", owner_username: "charlie" });
		store.setState((prev) => ({ ...prev, userLibraryEntries: { f1: u1 } }));

		const onSelect = vi.fn();
		const { result } = renderHook(() => useUserSearchInput({ activeUserId: "f1", onSelect }));

		expect(result.current.inputDisplayValue).toBe("charlie");
	});

	it("handleInputFocus opens dropdown and outside mousedown closes it", async () => {
		const store = useAppStore;
		const u1 = makeUserLibraryEntry({ followed_user_id: "f1", owner_username: "alice" });
		store.setState((prev) => ({ ...prev, userLibraryEntries: { f1: u1 } }));

		const onSelect = vi.fn();
		const { result } = renderHook(() => useUserSearchInput({ activeUserId: undefined, onSelect }));

		const container = document.createElement("div");
		const insideButton = document.createElement("button");
		container.append(insideButton);
		document.body.append(container);

		Reflect.set(result.current.containerRef, "current", container);

		result.current.handleInputFocus();
		await waitFor(() => {
			expect(result.current.isOpen).toBe(true);
		});

		insideButton.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
		await waitFor(() => {
			expect(result.current.isOpen).toBe(true);
		});

		document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
		await waitFor(() => {
			expect(result.current.isOpen).toBe(false);
		});

		container.remove();
	});
});
