import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import makeUserLibraryEntry from "@/react/user-library/test-utils/makeUserLibraryEntry.mock";

import UserSearchInput from "./UserSearchInput";

/**
 * Basic sanity tests for the dropdown presentation so we don't
 * accidentally regress and show UUIDs everywhere.
 */
describe("userSearchInput component", () => {
	it("renders a dropdown item using the username when available", async () => {
		const store = useAppStore;
		const alice = makeUserLibraryEntry({ followed_user_id: "f1", owner_username: "alice" });
		store.setState((prev) => ({ ...prev, userLibraryEntries: { f1: alice } }));

		const handleSelect = vi.fn();
		render(<UserSearchInput activeUserId={undefined} onSelect={handleSelect} />);

		const [input = document.createElement("input")] = screen.getAllByRole("textbox");
		fireEvent.focus(input);

		// item should appear showing the username
		await screen.findByText("alice");
		// and not display the raw uuid anywhere in the list
		expect(screen.queryByText("f1")).toBeNull();
	});

	it("falls back to showing id when no username is set", async () => {
		const store = useAppStore;
		// makeUserLibraryEntry requires a string, so pass empty and treat it as missing
		const bob = makeUserLibraryEntry({ followed_user_id: "f2", owner_username: "" });
		store.setState((prev) => ({ ...prev, userLibraryEntries: { f2: bob } }));

		const handleSelect = vi.fn();
		render(<UserSearchInput activeUserId={undefined} onSelect={handleSelect} />);

		const [input = document.createElement("input")] = screen.getAllByRole("textbox");
		expect(input).toBeDefined();
		fireEvent.focus(input);

		// empty username should fall back to id display
		await screen.findByText("f2");
	});
});
