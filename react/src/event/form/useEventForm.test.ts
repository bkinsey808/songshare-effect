import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { useNavigate, useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import mockLocaleWithLang from "@/react/lib/test-utils/mockLocaleWithLang";
import { makeTestPlaylist } from "@/react/playlist/test-utils/makeTestPlaylist.mock";
import { makeTestSong } from "@/react/song/test-utils/makeTestSong.mock";

import useEventForm from "./useEventForm";

vi.mock("react-router-dom");
vi.mock("@/react/language/locale/useLocale");

/*
 Reuse the same auth fetch stub used in playlist tests to prevent background
 auth requests from interfering with tests (getSupabaseAuthToken calls).
*/
async function withAuthFetchMock(task: () => unknown) {
	const original =
		typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : undefined;

	async function authFetchMock(input: URL | RequestInfo, init?: RequestInit): Promise<Response> {
		let url = "";
		if (typeof input === "string") {
			url = input;
		} else if (input instanceof URL) {
			url = input.href;
		} else {
			const req = input;
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

		const result = original ? await original(input, init) : undefined;
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

describe("useEventForm", () => {
	it("auto-generates slug on name change when creating", async () => {
		vi.resetAllMocks();
		mockLocaleWithLang("en");

		vi.mocked(useParams).mockReturnValue({});

		const { result } = renderHook(() => useEventForm());

		result.current.handleNameChange("My Event");

		await waitFor(() => {
			expect(result.current.formValues.event_name).toBe("My Event");
			expect(result.current.formValues.event_slug).toBe("my-event");
		});
	});

	it("handlePlaylistSelect converts empty string to undefined and sets id", async () => {
		vi.resetAllMocks();
		mockLocaleWithLang("en");

		vi.mocked(useParams).mockReturnValue({});

		const { result } = renderHook(() => useEventForm());

		result.current.handlePlaylistSelect("");
		await waitFor(() => {
			expect(result.current.formValues.active_playlist_id).toBeUndefined();
		});

		result.current.handlePlaylistSelect("pl-1");
		await waitFor(() => {
			expect(result.current.formValues.active_playlist_id).toBe("pl-1");
		});
	});

	it("submits and navigates on successful create", async () => {
		await withAuthFetchMock(async () => {
			vi.resetAllMocks();
			mockLocaleWithLang("en");

			const mockNavigate = vi.fn();
			vi.mocked(useNavigate).mockReturnValue(mockNavigate);
			vi.mocked(useParams).mockReturnValue({});

			const store: typeof useAppStore = useAppStore;
			const mockSave = vi.fn().mockReturnValue(Effect.succeed("e1"));
			store.setState((prev) => ({ ...prev, saveEvent: mockSave }));

			const { result } = renderHook(() => useEventForm());

			// Populate form
			result.current.handleNameChange("My Event");
			result.current.setEventSlug("my-event");
			result.current.handleIsPublicChange(true);
			result.current.setPublicNotes("pub");
			result.current.setPrivateNotes("priv");
			result.current.handlePlaylistSelect("pl-1");
			result.current.handleDateChange("2026/02/07 12:00");

			await waitFor(() => {
				expect(result.current.formValues.event_name).toBe("My Event");
			});

			// Call submit and await completion
			await result.current.handleFormSubmit();

			// saveEvent called with expected payload
			expect(mockSave).toHaveBeenCalledWith(
				expect.objectContaining({
					event_name: "My Event",
					event_slug: "my-event",
					is_public: true,
					active_playlist_id: "pl-1",
				}),
			);
			// Navigation to created event
			expect(mockNavigate).toHaveBeenCalledWith("/events/my-event");
		});
	});

	it("includes event_id when editing", async () => {
		await withAuthFetchMock(async () => {
			vi.resetAllMocks();
			mockLocaleWithLang("en");

			const mockNavigate = vi.fn();
			vi.mocked(useNavigate).mockReturnValue(mockNavigate);
			vi.mocked(useParams).mockReturnValue({ event_id: "ev-1" });

			const store: typeof useAppStore = useAppStore;
			const mockSave = vi.fn().mockReturnValue(Effect.succeed("ev-1"));
			store.setState((prev) => ({ ...prev, saveEvent: mockSave }));

			const { result } = renderHook(() => useEventForm());

			result.current.setFormValue("event_id", "ev-1");
			result.current.handleNameChange("Edit Me");
			result.current.setEventSlug("edit-me");
			result.current.handleIsPublicChange(true);
			result.current.setPublicNotes("pub");
			result.current.setPrivateNotes("priv");

			await waitFor(() => {
				// Ensure values are flushed
				expect(result.current.formValues.event_name).toBe("Edit Me");
			});

			await result.current.handleFormSubmit();

			await waitFor(() => {
				expect(mockSave).toHaveBeenCalledWith(
					expect.objectContaining({
						event_id: "ev-1",
						event_name: "Edit Me",
						event_slug: "edit-me",
					}),
				);
			});
		});
	});

	it("sends is_public false when creating with unchecked visibility", async () => {
		await withAuthFetchMock(async () => {
			vi.resetAllMocks();
			mockLocaleWithLang("en");

			const mockNavigate = vi.fn();
			vi.mocked(useNavigate).mockReturnValue(mockNavigate);
			vi.mocked(useParams).mockReturnValue({});

			const store: typeof useAppStore = useAppStore;
			const mockSave = vi.fn().mockReturnValue(Effect.succeed("e2"));
			store.setState((prev) => ({ ...prev, saveEvent: mockSave }));

			const { result } = renderHook(() => useEventForm());

			result.current.handleNameChange("Private Event");
			result.current.setEventSlug("private-event");

			await waitFor(() => {
				expect(result.current.formValues.event_name).toBe("Private Event");
			});

			await result.current.handleFormSubmit();

			expect(mockSave).toHaveBeenCalledWith(
				expect.objectContaining({
					event_name: "Private Event",
					event_slug: "private-event",
					is_public: false,
				}),
			);
		});
	});

	it("clears stale event error when opening create form", async () => {
		vi.resetAllMocks();
		mockLocaleWithLang("en");
		vi.mocked(useParams).mockReturnValue({});

		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, eventError: "Invalid event_public data" }));

		const { result } = renderHook(() => useEventForm());

		await waitFor(() => {
			expect(result.current.error).toBeUndefined();
		});
	});

	it("defaults active song to first track when playlist is selected", async () => {
		await withAuthFetchMock(async () => {
			vi.resetAllMocks();
			mockLocaleWithLang("en");
			vi.mocked(useParams).mockReturnValue({});

			const store: typeof useAppStore = useAppStore;
			const mockFetchPlaylistById = vi.fn().mockReturnValue(Effect.succeed(undefined));
			store.setState((prev) => ({
				...prev,
				fetchPlaylistById: mockFetchPlaylistById,
				currentPlaylist: makeTestPlaylist({
					playlist_id: "pl-1",
					public: {
						playlist_id: "pl-1",
						playlist_name: "My Playlist",
						playlist_slug: "my-playlist",
						user_id: "u1",
						song_order: ["s1", "s2"],
						created_at: "",
						updated_at: "",
						public_notes: "",
					},
				}),
				publicSongs: {
					s1: makeTestSong({
						song_id: "s1",
						song_name: "Song 1",
						slide_order: ["sl-1", "sl-2"],
					}),
					s2: makeTestSong({ song_id: "s2", song_name: "Song 2" }),
				},
			}));

			const { result } = renderHook(() => useEventForm());
			result.current.handlePlaylistSelect("pl-1");

			await waitFor(() => {
				expect(result.current.formValues.active_song_id).toBe("s1");
				expect(result.current.formValues.active_slide_id).toBe("sl-1");
			});
		});
	});

	it("allows selecting a different active song", async () => {
		await withAuthFetchMock(async () => {
			vi.resetAllMocks();
			mockLocaleWithLang("en");
			vi.mocked(useParams).mockReturnValue({});

			const store: typeof useAppStore = useAppStore;
			store.setState((prev) => ({
				...prev,
				currentPlaylist: makeTestPlaylist({
					playlist_id: "pl-1",
					public: {
						playlist_id: "pl-1",
						playlist_name: "My Playlist",
						playlist_slug: "my-playlist",
						user_id: "u1",
						song_order: ["s1", "s2"],
						created_at: "",
						updated_at: "",
						public_notes: "",
					},
				}),
				publicSongs: {
					s1: makeTestSong({
						song_id: "s1",
						song_name: "Song 1",
						slide_order: ["sl-1", "sl-2"],
					}),
					s2: makeTestSong({
						song_id: "s2",
						song_name: "Song 2",
						slide_order: ["sl-3"],
					}),
				},
			}));

			const { result } = renderHook(() => useEventForm());
			result.current.handlePlaylistSelect("pl-1");

			await waitFor(() => {
				expect(result.current.formValues.active_song_id).toBe("s1");
				expect(result.current.formValues.active_slide_id).toBe("sl-1");
			});

			result.current.handleActiveSongSelect("s2");

			await waitFor(() => {
				expect(result.current.formValues.active_song_id).toBe("s2");
				expect(result.current.formValues.active_slide_id).toBe("sl-3");
			});

			result.current.handleActiveSlideSelect("sl-3");

			await waitFor(() => {
				expect(result.current.formValues.active_slide_id).toBe("sl-3");
			});
		});
	});
});
