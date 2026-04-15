import type { DragEndEvent } from "@dnd-kit/core";
import { cleanup, render, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import usePlaylistDragAndDrop from "./usePlaylistDragAndDrop";

const SONG_ORDER = ["song-a", "song-b", "song-c"];

describe("usePlaylistDragAndDrop — Harness", () => {
	it("harness renders and exposes sensors, handleDragEnd, sortableItems", () => {
		cleanup();
		const setSongOrder = vi.fn();

		/**
		 * Test harness for `usePlaylistDragAndDrop` that exposes sensors and handlers.
		 *
		 * @returns A small DOM tree used to validate drag-and-drop behavior.
		 */
		function Harness(): ReactElement {
			const { sensors, handleDragEnd, sortableItems } = usePlaylistDragAndDrop({
				songOrder: SONG_ORDER,
				setSongOrder,
			});
			return (
				<div data-testid="harness-root">
					<span data-testid="items">{sortableItems.join(",")}</span>
					<button
						type="button"
						data-testid="drag"
						onClick={() => {
							handleDragEnd(
								forceCast<DragEndEvent>({
									active: { id: "song-a" },
									over: { id: "song-c" },
								}),
							);
						}}
					>
						Drag
					</button>
					<span data-testid="sensor-count">{sensors.length}</span>
				</div>
			);
		}
		const { getByTestId } = render(<Harness />);

		expect(getByTestId("harness-root")).toBeTruthy();
		expect(getByTestId("items").textContent).toBe("song-a,song-b,song-c");
	});
});

describe("usePlaylistDragAndDrop — renderHook", () => {
	it("sortableItems mirrors song order", () => {
		const setSongOrder = vi.fn();

		const { result } = renderHook(() =>
			usePlaylistDragAndDrop({ songOrder: SONG_ORDER, setSongOrder }),
		);

		expect(result.current.sortableItems).toStrictEqual(SONG_ORDER);
	});

	it("handleDragEnd reorders when active and over differ", () => {
		const setSongOrder = vi.fn();

		const { result } = renderHook(() =>
			usePlaylistDragAndDrop({ songOrder: SONG_ORDER, setSongOrder }),
		);

		result.current.handleDragEnd(
			forceCast<DragEndEvent>({
				active: { id: "song-a" },
				over: { id: "song-c" },
			}),
		);

		expect(setSongOrder).toHaveBeenCalledWith(["song-b", "song-c", "song-a"]);
	});

	it("handleDragEnd does nothing when over is null", () => {
		const setSongOrder = vi.fn();

		const { result } = renderHook(() =>
			usePlaylistDragAndDrop({ songOrder: SONG_ORDER, setSongOrder }),
		);

		result.current.handleDragEnd(
			forceCast<DragEndEvent>({ active: { id: "song-a" }, over: undefined }),
		);

		expect(setSongOrder).not.toHaveBeenCalled();
	});
});
