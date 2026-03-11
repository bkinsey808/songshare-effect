import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { EventPublic } from "@/react/event/event-types";

import usePlaybackSelectionSync from "./usePlaybackSelectionSync";

const basePublic: EventPublic = {
	event_id: "e1",
	event_name: "n",
	event_slug: "s",
	owner_id: "u1",
	is_public: true,
};

describe("usePlaybackSelectionSync", () => {
	it("clears song selection when eventPublic.active_song_id changes", () => {
		let songState: string | undefined = "old";
		function setSongState(value: string | undefined): void {
			songState = value;
		}

		const { rerender } = renderHook(
			(props: { eventPublic: EventPublic; selectedSongId?: string; selectedSlidePos?: number }) => {
				usePlaybackSelectionSync({
					eventPublic: props.eventPublic,
					selectedSongId: props.selectedSongId,
					selectedSlidePosition: props.selectedSlidePos,
					setSelectedSongId: setSongState,
					setSelectedSlidePosition: () => {
						/* noop */
					},
				});
			},
			{
				initialProps: {
					eventPublic: { ...basePublic, active_song_id: "old" },
					selectedSongId: "old",
				},
			},
		);

		rerender({
			eventPublic: { ...basePublic, active_song_id: "new" },
			selectedSongId: "old",
		});

		expect(songState).toBeUndefined();
	});

	it("clears slide selection when eventPublic.active_slide_position changes", () => {
		let slideState: number | undefined = 1;
		function setSlideState(value: number | undefined): void {
			slideState = value;
		}

		const { rerender } = renderHook(
			(props: { eventPublic: EventPublic; selectedSongId?: string; selectedSlidePos?: number }) => {
				usePlaybackSelectionSync({
					eventPublic: props.eventPublic,
					selectedSongId: props.selectedSongId,
					selectedSlidePosition: props.selectedSlidePos,
					setSelectedSongId: () => {
						/* noop */
					},
					setSelectedSlidePosition: setSlideState,
				});
			},
			{
				initialProps: {
					eventPublic: { ...basePublic, active_slide_position: 1 },
					selectedSlidePos: 1,
				},
			},
		);

		rerender({
			eventPublic: { ...basePublic, active_slide_position: 2 },
			selectedSlidePos: 1,
		});

		expect(slideState).toBeUndefined();
	});

	it("does not clear selection when playback state hasn't changed (even if the event object reference or local choices change)", () => {
		let songState: string | undefined = "initial";
		let slideState: number | undefined = 1;
		function setSongState(value: string | undefined): void {
			songState = value;
		}
		function setSlideState(value: number | undefined): void {
			slideState = value;
		}

		const INITIAL_SLIDE = 1;

		const { rerender } = renderHook(
			(props: { eventPublic: EventPublic; selectedSongId?: string; selectedSlidePos?: number }) => {
				usePlaybackSelectionSync({
					eventPublic: props.eventPublic,
					selectedSongId: props.selectedSongId,
					selectedSlidePosition: props.selectedSlidePos,
					setSelectedSongId: setSongState,
					setSelectedSlidePosition: setSlideState,
				});
			},
			{
				initialProps: {
					eventPublic: {
						...basePublic,
						active_song_id: "initial",
						active_slide_position: INITIAL_SLIDE,
					},
					selectedSongId: "initial",
					selectedSlidePos: INITIAL_SLIDE,
				},
			},
		);

		// simulate both a new object and local changes; playback data remains the same
		rerender({
			eventPublic: {
				...basePublic,
				active_song_id: "initial",
				active_slide_position: INITIAL_SLIDE,
			},
			selectedSongId: "local",
			selectedSlidePos: 2,
		});

		expect(songState).toBe("initial");
		expect(slideState).toBe(INITIAL_SLIDE);
	});
});
