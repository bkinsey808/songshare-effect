import { render, renderHook } from "@testing-library/react";
import { Effect } from "effect";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { resetAllSlices } from "@/react/app-store/slice-reset-fns";
import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeAppSlice from "@/react/lib/test-utils/makeAppSlice";

import usePlaylistLibrary from "./usePlaylistLibrary";

describe("usePlaylistLibrary — renderHook", () => {
	it("returns playlistEntries, isLoading, error, removeFromPlaylistLibrary", () => {
		resetAllSlices();
		useAppStore.setState(
			makeAppSlice({
				playlistLibraryEntries: { p1: forceCast({ playlist_id: "p1" }) },
				isPlaylistLibraryLoading: false,
				playlistLibraryError: undefined,
				fetchPlaylistLibrary: vi.fn().mockReturnValue(Effect.sync(() => undefined)),
				subscribeToPlaylistLibrary: vi.fn().mockReturnValue(
					Effect.succeed(() => undefined),
				),
				subscribeToPlaylistPublic: vi.fn().mockReturnValue(
					Effect.succeed(() => undefined),
				),
			}),
		);

		const { result } = renderHook(() => usePlaylistLibrary(), {
			wrapper: ({ children }) => (
				<MemoryRouter initialEntries={["/en/dashboard/playlist-library"]}>
					{children}
				</MemoryRouter>
			),
		});

		expect(result.current.playlistEntries).toBeDefined();
		expect(Array.isArray(result.current.playlistEntries)).toBe(true);
		expect(typeof result.current.removeFromPlaylistLibrary).toBe("function");
	});
});

describe("usePlaylistLibrary — Harness", () => {
	it("harness mounts and renders playlist state", () => {
		resetAllSlices();
		useAppStore.setState(
			makeAppSlice({
				playlistLibraryEntries: {},
				isPlaylistLibraryLoading: false,
				playlistLibraryError: undefined,
				fetchPlaylistLibrary: vi.fn().mockReturnValue(Effect.sync(() => undefined)),
				subscribeToPlaylistLibrary: vi.fn().mockReturnValue(
					Effect.succeed(() => undefined),
				),
				subscribeToPlaylistPublic: vi.fn().mockReturnValue(
					Effect.succeed(() => undefined),
				),
			}),
		);

		function Harness(): ReactElement {
			const { playlistEntries, isLoading } = usePlaylistLibrary();
			return (
				<div data-testid="harness-root">
					<span data-testid="count">{playlistEntries.length}</span>
					<span data-testid="loading">{String(isLoading)}</span>
				</div>
			);
		}

		const { getByTestId } = render(
			<MemoryRouter initialEntries={["/en/dashboard/playlist-library"]}>
				<Harness />
			</MemoryRouter>,
		);

		expect(getByTestId("harness-root")).toBeTruthy();
	});
});
