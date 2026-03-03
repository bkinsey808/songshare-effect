import {
	cleanup,
	fireEvent,
	render,
	renderHook,
	waitFor,
	within,
	type RenderHookResult,
} from "@testing-library/react";
import { Effect } from "effect";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { EventEntry } from "@/react/event/event-types";

import type { ActionState } from "../ActionState.type";

import useEventPlaybackManagement from "./useEventPlaybackManagement";

// Prevent side-effects from selection sync and autosave flush hooks
vi.mock("../usePlaybackAutosaveFlush");
vi.mock("../usePlaybackSelectionSync");

type HookResult = ReturnType<typeof useEventPlaybackManagement>;
type SetupReturn = RenderHookResult<HookResult, unknown>;
describe("useEventPlaybackManagement", () => {
	const NEW_PLAYLIST = "p2";

	/**
	 * Harness for `useEventPlaybackManagement`.
	 *
	 * Documentation by Harness: shows how the hook is used in JSX and exposes
	 * handlers/state via `data-testid` so tests can assert observable outcomes.
	 *
	 * Props:
	 * - `eventPublic` — partial public event state to seed the hook
	 */
	function Harness({ eventPublic }: { eventPublic?: Partial<EventEntry["public"]> }): ReactElement {
		const fetchEventBySlug = vi.fn().mockReturnValue(Effect.succeed(undefined as void));
		const currentEventIdRef = { current: "event-123" } as React.RefObject<string | undefined>;
		const [, setActionState] = useState<ActionState>({
			loadingKey: undefined,
			error: undefined,
			success: undefined,
		});

		const fullEventPublic = eventPublic
			? ({
					event_id: "evt-1",
					owner_id: "owner-1",
					event_name: "ev",
					event_slug: "ev",
					is_public: false,
					...eventPublic,
				} as EventEntry["public"])
			: undefined;

		const { selectedActivePlaylistId, setSelectedActivePlaylistId, activePlaylistIdForSelector } =
			useEventPlaybackManagement({
				event_slug: "e1",
				fetchEventBySlug,
				eventPublic: fullEventPublic,
				currentEventIdRef,
				setActionState,
			});

		return (
			<div>
				{/* selected value (may be undefined) */}
				<div data-testid="selected-playlist">{String(selectedActivePlaylistId ?? "")}</div>
				{/* selector-resolved value: either selection override or event public */}
				<div data-testid="active-playlist-selector">
					{String(activePlaylistIdForSelector ?? "")}
				</div>
				{/* button documents how to set the selected playlist */}
				<button
					type="button"
					data-testid="set-playlist"
					onClick={() => {
						setSelectedActivePlaylistId(NEW_PLAYLIST);
					}}
				>
					Set playlist
				</button>
			</div>
		);
	}

	describe("harness (DOM) behavior", () => {
		it("updates selected playlist when harness button clicked", async () => {
			const eventPublic = {
				event_id: "evt-1",
				owner_id: "owner-1",
				event_name: "ev",
				event_slug: "ev",
				is_public: false,
				active_playlist_id: "p1",
			} as EventEntry["public"];

			// cleanup required per harness guidance
			cleanup();

			const rendered = render(<Harness eventPublic={eventPublic} />);

			const btn = within(rendered.container).getByTestId("set-playlist");
			fireEvent.click(btn);

			await waitFor(() => {
				expect(within(rendered.container).getByTestId("selected-playlist").textContent).toBe(
					NEW_PLAYLIST,
				);
				expect(within(rendered.container).getByTestId("active-playlist-selector").textContent).toBe(
					NEW_PLAYLIST,
				);
			});
		});
	});

	describe("renderHook behavior", () => {
		type SetupArgs = {
			eventPublic?: Partial<EventEntry["public"]> | undefined;
		};

		function setup({ eventPublic }: SetupArgs = {}): SetupReturn {
			const fetchEventBySlug = vi.fn().mockReturnValue(Effect.succeed(undefined as void));
			const currentEventIdRef = { current: "event-123" } as React.RefObject<string | undefined>;

			return renderHook<HookResult, unknown>(() => {
				const [, setActionState] = useState<ActionState>({
					loadingKey: undefined,
					error: undefined,
					success: undefined,
				});
				const fullEventPublic = eventPublic
					? ({
							event_id: "evt-1",
							owner_id: "owner-1",
							event_name: "ev",
							event_slug: "ev",
							is_public: false,
							...eventPublic,
						} as EventEntry["public"])
					: undefined;

				return useEventPlaybackManagement({
					event_slug: "e1",
					fetchEventBySlug,
					eventPublic: fullEventPublic,
					currentEventIdRef,
					setActionState,
				});
			});
		}

		it("uses eventPublic values when no selection overrides are set", () => {
			const SLIDE_POS = 2;
			const eventPublic = {
				event_id: "evt-1",
				owner_id: "owner-1",
				event_name: "ev",
				event_slug: "ev",
				is_public: false,
				active_playlist_id: "p1",
				active_song_id: "s1",
				active_slide_position: SLIDE_POS,
			};
			const { result } = setup({ eventPublic });

			expect(result.current.activePlaylistIdForSelector).toBe("p1");
			expect(result.current.activeSongIdForSelector).toBe("s1");
			expect(result.current.activeSlidePositionForSelector).toBe(SLIDE_POS);
		});

		it("setSelectedActivePlaylistId overrides the active playlist selector", async () => {
			const eventPublic = {
				event_id: "evt-1",
				owner_id: "owner-1",
				event_name: "ev",
				event_slug: "ev",
				is_public: false,
				active_playlist_id: "p1",
			};
			const { result } = setup({ eventPublic });

			result.current.setSelectedActivePlaylistId("p2");

			await waitFor(() => {
				expect(result.current.selectedActivePlaylistId).toBe("p2");
				expect(result.current.activePlaylistIdForSelector).toBe("p2");
			});
		});
	});
});
