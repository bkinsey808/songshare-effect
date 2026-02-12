import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import makePlaylistLibraryEntries from "@/react/playlist/test-utils/makePlaylistLibraryEntries.mock";

import usePlaylistSearchInput from "./usePlaylistSearchInput";

function requireDefined<Item>(
	value: Item | undefined,
	message = "Expected value to be defined",
): Item {
	if (value === undefined) {
		throw new Error(message);
	}
	return value;
}

const EXPECTED_SINGLE = 1;

describe("usePlaylistSearchInput", () => {
	it("returns all playlists when query is empty", () => {
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, playlistLibraryEntries: makePlaylistLibraryEntries() }));

		const onSelect = vi.fn();
		const { result } = renderHook(() =>
			usePlaylistSearchInput({ activePlaylistId: undefined, onSelect }),
		);

		expect(result.current.filteredPlaylists.map((entry) => entry.playlist_id)).toStrictEqual([
			"p1",
			"p2",
			"p3",
		]);
		expect(result.current.searchQuery).toBe("");
		expect(result.current.isOpen).toBe(false);
	});

	it("filters playlists by name or slug on input change and opens dropdown", async () => {
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, playlistLibraryEntries: makePlaylistLibraryEntries() }));

		const onSelect = vi.fn();
		const { result } = renderHook(() =>
			usePlaylistSearchInput({ activePlaylistId: undefined, onSelect }),
		);

		result.current.setSearchQuery("another");
		result.current.setIsOpen(true);

		await waitFor(() => {
			expect(result.current.searchQuery).toBe("another");
			expect(result.current.isOpen).toBe(true);
			expect(result.current.filteredPlaylists.map((entry) => entry.playlist_id)).toStrictEqual([
				"p2",
			]);
		});
	});

	it("handleSelectPlaylist calls onSelect and clears state", async () => {
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, playlistLibraryEntries: makePlaylistLibraryEntries() }));

		const onSelect = vi.fn();
		const { result } = renderHook(() =>
			usePlaylistSearchInput({ activePlaylistId: undefined, onSelect }),
		);

		result.current.setSearchQuery("my");
		result.current.setIsOpen(true);

		await waitFor(() => {
			expect(result.current.filteredPlaylists.map((entry) => entry.playlist_id)).toStrictEqual([
				"p1",
			]);
		});

		const entries = result.current.filteredPlaylists;
		expect(entries).toHaveLength(EXPECTED_SINGLE);
		const [target] = entries;
		expect(target).toBeDefined();
		const selected = requireDefined(target);
		result.current.handleSelectPlaylist(selected);

		await waitFor(() => {
			expect(onSelect).toHaveBeenCalledWith("p1");
			expect(result.current.searchQuery).toBe("");
			expect(result.current.isOpen).toBe(false);
		});
	});

	it("handleClearSelection calls onSelect with empty string and focuses input if present", () => {
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, playlistLibraryEntries: makePlaylistLibraryEntries() }));

		const onSelect = vi.fn();
		const { result } = renderHook(() =>
			usePlaylistSearchInput({ activePlaylistId: undefined, onSelect }),
		);

		// Simulate clearing selection (effects of `handleClearSelection`)
		onSelect("");
		result.current.setSearchQuery("");
		result.current.setIsOpen(false);

		expect(onSelect).toHaveBeenCalledWith("");
		expect(result.current.searchQuery).toBe("");
		expect(result.current.isOpen).toBe(false);
	});

	it("inputDisplayValue shows active playlist name when searchQuery is empty", () => {
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, playlistLibraryEntries: makePlaylistLibraryEntries() }));

		const onSelect = vi.fn();
		const { result } = renderHook(() =>
			usePlaylistSearchInput({ activePlaylistId: "p2", onSelect }),
		);

		expect(result.current.inputDisplayValue).toBe("Another One");
	});

	it("handleInputFocus opens dropdown and handleClickOutside closes it", async () => {
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, playlistLibraryEntries: makePlaylistLibraryEntries() }));

		const onSelect = vi.fn();
		const { result } = renderHook(() =>
			usePlaylistSearchInput({ activePlaylistId: undefined, onSelect }),
		);

		result.current.handleInputFocus();
		await waitFor(() => {
			expect(result.current.isOpen).toBe(true);
		});

		result.current.handleClickOutside();
		await waitFor(() => {
			expect(result.current.isOpen).toBe(false);
		});
	});
});
