import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { SavePlaylistRequest } from "@/react/playlist/playlist-types";
import type { SupportedLanguageType } from "@/shared/language/supported-languages";

import { PlaylistError } from "@/react/playlist/playlist-errors";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, playlistLibraryPath } from "@/shared/paths";

import submitPlaylist from "./submitPlaylist";

describe("submitPlaylist", () => {
	it("navigates and returns id on success", async () => {
		function savePlaylist(_req: SavePlaylistRequest): Effect.Effect<string, PlaylistError> {
			return Effect.succeed("playlist-123");
		}

		const mockNavigateFn = vi.fn();
		function mockNavigate(to: unknown, options?: unknown): void {
			mockNavigateFn(to, options);
		}
		const lang = "en" as SupportedLanguageType;

		const params = {
			playlistName: "name",
			playlistSlug: "slug",
			publicNotes: "pub",
			privateNotes: "priv",
			songOrder: ["s1"],
		};

		const id = await submitPlaylist({ savePlaylist, navigate: mockNavigate, lang }, params);

		expect(id).toBe("playlist-123");

		const expectedPath = buildPathWithLang(`/${dashboardPath}/${playlistLibraryPath}`, lang);
		expect(mockNavigateFn).toHaveBeenCalledWith(expectedPath, undefined);
	});

	it("returns undefined and logs on failure", async () => {
		function savePlaylist(_req: SavePlaylistRequest): Effect.Effect<string, PlaylistError> {
			return Effect.fail(new PlaylistError("boom"));
		}

		const mockNavigateFn = vi.fn();
		function mockNavigate(to: unknown, options?: unknown): void {
			mockNavigateFn(to, options);
		}
		const lang = "en" as SupportedLanguageType;
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

		const params = {
			playlistName: "name",
			playlistSlug: "slug",
			publicNotes: "pub",
			privateNotes: "priv",
			songOrder: ["s1"],
		};

		const id = await submitPlaylist({ savePlaylist, navigate: mockNavigate, lang }, params);

		expect(id).toBeUndefined();
		expect(consoleError).toHaveBeenCalledWith("[submitPlaylist] Save failed:", expect.anything());
		expect(mockNavigateFn).not.toHaveBeenCalled();

		consoleError.mockRestore();
	});
});
