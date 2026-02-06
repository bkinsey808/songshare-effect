import { render } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import addUserToLibraryEffect from "@/react/user-library/user-add/addUserToLibraryEffect";

import PlaylistPage from "./PlaylistPage";

vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/user-library/user-add/addUserToLibraryEffect");

function installStoreMocks(options: {
	mockFetch: unknown;
	mockClear: unknown;
	currentPlaylistReturn?: unknown;
	userId?: string;
}): void {
	const { mockFetch, mockClear, currentPlaylistReturn, userId } = options;
	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		const selectorText = String(selector);
		if (selectorText.includes("currentPlaylist")) {
			return currentPlaylistReturn;
		}
		if (selectorText.includes("isPlaylistLoading")) {
			return false;
		}
		if (selectorText.includes("fetchPlaylist")) {
			return mockFetch;
		}
		if (selectorText.includes("clearCurrentPlaylist")) {
			return mockClear;
		}
		if (selectorText.includes("userSessionData")) {
			return { user: { user_id: userId } };
		}
		return undefined as unknown;
	});
}

describe("playlist page", () => {
	it("auto-adds playlist owner to user library when viewing playlist", () => {
		const mockFetch = vi.fn();
		const mockClear = vi.fn();
		// currentPlaylist has owner user_id = 'owner-123'
		installStoreMocks({
			mockFetch,
			mockClear,
			currentPlaylistReturn: {
				playlist_id: "p1",
				public: { playlist_name: "Test" },
				user_id: "owner-123",
				owner_username: "owner_user",
			},
			userId: "not-owner",
		});

		const mockAutoAdd = vi.mocked(addUserToLibraryEffect);
		mockAutoAdd.mockReturnValue(Effect.sync(() => undefined));

		render(<PlaylistPage />);

		expect(mockAutoAdd).toHaveBeenCalledWith(
			{ followed_user_id: "owner-123" },
			expect.any(Function),
		);
	});
});
