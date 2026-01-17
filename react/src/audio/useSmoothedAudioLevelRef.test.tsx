import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useSmoothedAudioLevelRef from "./useSmoothedAudioLevelRef";

// Mock the underlying `useSmoothedAudioLevel` hook so we can control what
// `useSmoothedAudioLevelRef` receives across renders.
let currentMockAudioLevel: unknown = undefined;

vi.mock("./useSmoothedAudioLevel", () => ({
	__esModule: true,
	default: (_refs: unknown, _options: unknown): unknown => currentMockAudioLevel,
}));

describe("useSmoothedAudioLevelRef (behavior)", () => {
	beforeEach(() => {
		currentMockAudioLevel = { id: "initial" };
	});

	it("returns audioLevel and audioLevelRef that point to the same instance initially", async () => {
		const refs = {
			analyserRef: { current: undefined as AnalyserNode | undefined },
			timeDomainBytesRef: { current: undefined as Uint8Array<ArrayBuffer> | undefined },
		};
		const options = { uiIntervalMs: 100, smoothingAlpha: 0.6 };

		const { result, unmount } = renderHook(() => useSmoothedAudioLevelRef(refs, options));

		await waitFor(() => {
			expect(result.current).toBeDefined();
		});

		expect(result.current?.audioLevel).toBe(currentMockAudioLevel);
		expect(result.current?.audioLevelRef.current).toBe(currentMockAudioLevel);

		unmount();
	});

	it("updates audioLevelRef.current when audioLevel changes but keeps the same ref object", async () => {
		const refs = {
			analyserRef: { current: undefined as AnalyserNode | undefined },
			timeDomainBytesRef: { current: undefined as Uint8Array<ArrayBuffer> | undefined },
		};
		const options = { uiIntervalMs: 100, smoothingAlpha: 0.6 };

		const { result, rerender, unmount } = renderHook(() => useSmoothedAudioLevelRef(refs, options));

		await waitFor(() => {
			expect(result.current).toBeDefined();
		});

		const initialRef = result.current.audioLevelRef;
		expect(initialRef.current).toBe(currentMockAudioLevel);

		const newLevel = { id: "updated" };
		currentMockAudioLevel = newLevel;
		rerender();

		await waitFor(() => {
			expect(result.current?.audioLevel).toBe(newLevel);
		});

		expect(result.current?.audioLevelRef.current).toBe(newLevel);
		expect(result.current?.audioLevelRef).toBe(initialRef);

		unmount();
	});

	it("handles undefined audio level", async () => {
		const refs = {
			analyserRef: { current: undefined as AnalyserNode | undefined },
			timeDomainBytesRef: { current: undefined as Uint8Array<ArrayBuffer> | undefined },
		};
		const options = { uiIntervalMs: 100, smoothingAlpha: 0.6 };

		currentMockAudioLevel = undefined;
		const { result, unmount } = renderHook(() => useSmoothedAudioLevelRef(refs, options));

		await waitFor(() => {
			expect(result.current).toBeDefined();
		});

		expect(result.current?.audioLevel).toBeUndefined();
		expect(result.current?.audioLevelRef.current).toBeUndefined();

		unmount();
	});
});
