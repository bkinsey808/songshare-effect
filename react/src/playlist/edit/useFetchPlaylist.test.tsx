import { render, renderHook } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { resetAllSlices } from "@/react/app-store/slice-reset-fns";
import useAppStore from "@/react/app-store/useAppStore";
import makeAppSlice from "@/react/lib/test-utils/makeAppSlice";

import useFetchPlaylist from "./useFetchPlaylist";

describe("useFetchPlaylist — renderHook", () => {
	it("does not fetch when playlistId is undefined", async () => {
		vi.clearAllMocks();
		const fetchPlaylistById = vi.fn().mockReturnValue(Effect.sync(() => undefined));
		resetAllSlices();
		useAppStore.setState(
			makeAppSlice({
				fetchPlaylistById,
				clearCurrentPlaylist: vi.fn(),
				currentPlaylist: undefined,
			}),
		);

		renderHook(() => {
			useFetchPlaylist(undefined);
		});

		await Promise.resolve();
		await Promise.resolve();

		expect(fetchPlaylistById).not.toHaveBeenCalled();
	});

	it("calls fetchPlaylistById when playlistId is set and differs from current", async () => {
		vi.clearAllMocks();
		const fetchPlaylistById = vi.fn().mockReturnValue(Effect.sync(() => undefined));
		const clearCurrentPlaylist = vi.fn();

		resetAllSlices();
		useAppStore.setState(
			makeAppSlice({
				fetchPlaylistById,
				clearCurrentPlaylist,
				currentPlaylist: undefined,
			}),
		);

		renderHook(() => {
			useFetchPlaylist("p1");
		});

		await Promise.resolve();
		await Promise.resolve();

		expect(fetchPlaylistById).toHaveBeenCalledWith("p1");
	});

	it("calls clearCurrentPlaylist on unmount", () => {
		const clearCurrentPlaylist = vi.fn();
		resetAllSlices();
		useAppStore.setState(
			makeAppSlice({
				fetchPlaylistById: vi.fn().mockReturnValue(Effect.sync(() => undefined)),
				clearCurrentPlaylist,
			}),
		);

		const { unmount } = renderHook(() => {
			useFetchPlaylist(undefined);
		});

		unmount();

		expect(clearCurrentPlaylist).toHaveBeenCalledWith();
	});
});

describe("useFetchPlaylist — Harness", () => {
	it("harness mounts hook without error", () => {
		resetAllSlices();
		useAppStore.setState(
			makeAppSlice({
				fetchPlaylistById: vi.fn().mockReturnValue(Effect.sync(() => undefined)),
				clearCurrentPlaylist: vi.fn(),
			}),
		);

		/**
		 * Test harness that mounts `useFetchPlaylist` to ensure it runs without error.
		 *
		 * @returns A trivial DOM node used as a mounting point.
		 */
		function Harness(): ReactElement {
			useFetchPlaylist("p1");
			return <div data-testid="harness-root" />;
		}

		const { getByTestId } = render(<Harness />);

		expect(getByTestId("harness-root")).toBeTruthy();
	});
});
