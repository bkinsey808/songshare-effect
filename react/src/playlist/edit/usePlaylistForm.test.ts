import { renderHook, waitFor } from "@testing-library/react";
import { useNavigate, useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import mockLocaleWithLang from "@/react/test-utils/mockLocaleWithLang";
import { getOrCreateAppStore } from "@/react/zustand/useAppStore";

import submitPlaylist from "./helpers/submitPlaylist";
import usePlaylistForm from "./usePlaylistForm";

vi.mock("react-router-dom");
vi.mock("@/react/language/locale/useLocale");
vi.mock("./helpers/submitPlaylist");
// Prevent background auth fetches from starting during tests by stubbing
// network responses for the auth endpoints used by getSupabaseAuthToken.
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
async function withAuthFetchMock<ReturnType>(task: () => Promise<ReturnType> | ReturnType) {
	const original =
		typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : undefined;

	async function authFetchMock(input: URL | RequestInfo, init?: RequestInit): Promise<Response> {
		let url = "";
		if (typeof input === "string") {
			url = input;
		} else if (input instanceof URL) {
			url = input.href;
		} else {
			const req = input as unknown as Request;
			const { url: reqUrl } = req;
			url = reqUrl;
		}

		if (url.endsWith("/api/auth/visitor")) {
			return Response.json({ access_token: "visitor-token", expires_in: 3600 }, { status: 200 });
		}
		if (url.endsWith("/api/auth/user/token")) {
			return Response.json(
				{ success: true, data: { access_token: "user-token", expires_in: 3600 } },
				{ status: 200 },
			);
		}

		const result = original ? await original(input as unknown as RequestInfo, init) : undefined;
		return result ?? new Response(undefined, { status: 404 });
	}

	Object.defineProperty(globalThis, "fetch", {
		configurable: true,
		writable: true,
		value: authFetchMock,
	});

	try {
		return await task();
	} finally {
		Object.defineProperty(globalThis, "fetch", {
			value: original,
			configurable: true,
			writable: true,
		});
	}
}
/* eslint-enable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

describe("usePlaylistEdit", () => {
	it("delegates submit to submitPlaylist when creating a playlist", async () => {
		await withAuthFetchMock(async () => {
			vi.resetAllMocks();
			mockLocaleWithLang("en");

			const mockNavigate = vi.fn();
			vi.mocked(useNavigate).mockReturnValue(mockNavigate);
			vi.mocked(useParams).mockReturnValue({});

			const store = getOrCreateAppStore();
			const mockSave = vi.fn();
			store.setState((prev) => ({ ...prev, savePlaylist: mockSave }));

			const { result } = renderHook(() => usePlaylistForm());

			// Populate form state using public API
			result.current.handleNameChange("My Playlist");
			result.current.setPlaylistSlug("my-playlist");
			result.current.setPublicNotes("pub");
			result.current.setPrivateNotes("priv");
			result.current.handleSongAdded("s1");

			// Allow state to flush and assert the setter applied
			await waitFor(() => {
				expect(result.current.formValues.playlist_name).toBe("My Playlist");
			});

			await result.current.handleFormSubmit();

			expect(submitPlaylist).toHaveBeenCalledWith(
				expect.objectContaining({ savePlaylist: mockSave, navigate: mockNavigate, lang: "en" }),
				expect.objectContaining({
					playlistName: "My Playlist",
					playlistSlug: "my-playlist",
					publicNotes: "pub",
					privateNotes: "priv",
					songOrder: ["s1"],
				}),
			);

			// Playlist ID should be omitted when creating a new playlist
			expect(submitPlaylist).toHaveBeenCalledWith(
				expect.anything(),
				expect.not.objectContaining({ playlistId: undefined }),
			);
		});
	});

	it("includes playlistId when editing", async () => {
		await withAuthFetchMock(async () => {
			vi.resetAllMocks();
			mockLocaleWithLang("en");

			const mockNavigate = vi.fn();
			vi.mocked(useNavigate).mockReturnValue(mockNavigate);
			vi.mocked(useParams).mockReturnValue({ playlist_id: "pl-123" });

			const store = getOrCreateAppStore();
			const mockSave = vi.fn();
			store.setState((prev) => ({ ...prev, savePlaylist: mockSave }));

			const { result } = renderHook(() => usePlaylistForm());

			// Populate form state using public API
			result.current.handleNameChange("My Playlist");
			result.current.setPlaylistSlug("my-playlist");
			result.current.setPublicNotes("pub");
			result.current.setPrivateNotes("priv");
			result.current.handleSongAdded("s1");

			// Allow state to flush and assert the setter applied
			await waitFor(() => {
				expect(result.current.formValues.playlist_name).toBe("My Playlist");
			});

			await result.current.handleFormSubmit();

			expect(submitPlaylist).toHaveBeenCalledWith(
				expect.objectContaining({ savePlaylist: mockSave, navigate: mockNavigate, lang: "en" }),
				expect.objectContaining({
					playlistName: "My Playlist",
					playlistSlug: "my-playlist",
					publicNotes: "pub",
					privateNotes: "priv",
					songOrder: ["s1"],
					playlistId: "pl-123",
				}),
			);
		});
	});
});
