import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SmoothedAudioLevel } from "@/react/lib/audio/smooth/useSmoothedAudioLevel";

// Mock the underlying `useSmoothedAudioLevel` hook so we can control what
// `useSmoothedAudioLevelRef` receives across renders.
import {
	clearMockUseSmoothedAudioLevel,
	mockUseSmoothedAudioLevel,
	setMockUseSmoothedAudioLevel,
} from "@/react/lib/audio/smooth/mockUseSmoothedAudioLevel.mock";

const DEFAULT_LEVEL = 0;

function makeLevel(_id: string): SmoothedAudioLevel {
	return {
		levelUiValue: DEFAULT_LEVEL,
		peekSmoothedLevel: () => DEFAULT_LEVEL,
		readSmoothedLevelNow: () => DEFAULT_LEVEL,
		readBytesAndSmoothedLevelNow: () => undefined,
		startUiTimer: () => undefined,
		stopUiTimer: () => undefined,
		reset: () => undefined,
	};
}

// NOTE: Call `mockUseSmoothedAudioLevel()` inside tests (before importing the hook)
// so the mock is applied prior to module initialization. We intentionally import
// the hook dynamically below after applying the mock in each test.

describe("useSmoothedAudioLevelRef (behavior)", () => {
	function setup(): { cleanup: () => void; initial: SmoothedAudioLevel } {
		const initial = makeLevel("initial");
		setMockUseSmoothedAudioLevel(initial);
		return {
			cleanup: () => {
				clearMockUseSmoothedAudioLevel();
			},
			initial,
		};
	}

	it("returns audioLevel and audioLevelRef that point to the same instance initially", async () => {
		const { cleanup, initial } = setup();
		const refs = {
			analyserRef: { current: undefined as AnalyserNode | undefined },
			timeDomainBytesRef: { current: undefined as Uint8Array<ArrayBuffer> | undefined },
		};
		const options = { uiIntervalMs: 100, smoothingAlpha: 0.6 };

		mockUseSmoothedAudioLevel();
		const { default: useSmoothedAudioLevelRef } = await import("./useSmoothedAudioLevelRef");
		const { result, unmount } = renderHook(() => useSmoothedAudioLevelRef(refs, options));

		await waitFor(() => {
			expect(result.current).toBeDefined();
		});

		expect(result.current?.audioLevel).toBe(initial);
		expect(result.current?.audioLevelRef.current).toBe(initial);

		unmount();
		cleanup();
	});

	it("updates audioLevelRef.current when audioLevel changes but keeps the same ref object", async () => {
		const { cleanup, initial } = setup();
		const refs = {
			analyserRef: { current: undefined as AnalyserNode | undefined },
			timeDomainBytesRef: { current: undefined as Uint8Array<ArrayBuffer> | undefined },
		};
		const options = { uiIntervalMs: 100, smoothingAlpha: 0.6 };

		mockUseSmoothedAudioLevel();
		const { default: useSmoothedAudioLevelRef } = await import("./useSmoothedAudioLevelRef");
		const { result, rerender, unmount } = renderHook(() => useSmoothedAudioLevelRef(refs, options));

		await waitFor(() => {
			expect(result.current).toBeDefined();
		});

		const initialRef = result.current.audioLevelRef;
		expect(initialRef.current).toBe(initial);

		const newLevel = makeLevel("updated");
		setMockUseSmoothedAudioLevel(newLevel);
		rerender();

		await waitFor(() => {
			expect(result.current?.audioLevel).toBe(newLevel);
		});

		expect(result.current?.audioLevelRef.current).toBe(newLevel);
		expect(result.current?.audioLevelRef).toBe(initialRef);

		unmount();
		cleanup();
	});

	it("handles undefined audio level", async () => {
		const { cleanup } = setup();
		const refs = {
			analyserRef: { current: undefined as AnalyserNode | undefined },
			timeDomainBytesRef: { current: undefined as Uint8Array<ArrayBuffer> | undefined },
		};
		const options = { uiIntervalMs: 100, smoothingAlpha: 0.6 };

		clearMockUseSmoothedAudioLevel();
		mockUseSmoothedAudioLevel();
		const { default: useSmoothedAudioLevelRef } = await import("./useSmoothedAudioLevelRef");
		const { result, unmount } = renderHook(() => useSmoothedAudioLevelRef(refs, options));

		await waitFor(() => {
			expect(result.current).toBeDefined();
		});

		expect(result.current?.audioLevel).toBeUndefined();
		expect(result.current?.audioLevelRef.current).toBeUndefined();

		unmount();
		cleanup();
	});
});
