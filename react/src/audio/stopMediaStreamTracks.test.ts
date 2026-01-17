import { describe, expect, it, vi } from "vitest";

import type { MinimalMediaStream, MinimalMediaStreamTrack } from "./types";

import stopMediaStreamTracks from "./stopMediaStreamTracks";

/**
 * Create a fake MediaStream stub for testing.
 */
function makeFakeMediaStream(tracks: MinimalMediaStreamTrack[]): MinimalMediaStream {
	return {
		getTracks: (): MinimalMediaStreamTrack[] => tracks,
		getAudioTracks: (): MinimalMediaStreamTrack[] => tracks.filter(() => true), // Simplification for test
	};
}

/**
 * Create a fake MediaStreamTrack stub for testing.
 */
function makeFakeTrack(): MinimalMediaStreamTrack {
	return {
		stop: vi.fn(),
	};
}

const ONCE = 1;

describe("stopMediaStreamTracks", () => {
	it("calls stop() on all tracks in the stream", () => {
		const track1 = makeFakeTrack();
		const track2 = makeFakeTrack();
		const stream = makeFakeMediaStream([track1, track2]);

		stopMediaStreamTracks(stream);

		expect(track1.stop).toHaveBeenCalledTimes(ONCE);
		expect(track2.stop).toHaveBeenCalledTimes(ONCE);
	});

	it("does nothing when there are no tracks", () => {
		const stream = makeFakeMediaStream([]);

		// Should not throw
		expect(() => {
			stopMediaStreamTracks(stream);
		}).not.toThrow();
	});

	it("works with a single track", () => {
		const track = makeFakeTrack();
		const stream = makeFakeMediaStream([track]);

		stopMediaStreamTracks(stream);

		expect(track.stop).toHaveBeenCalledTimes(ONCE);
	});
});
