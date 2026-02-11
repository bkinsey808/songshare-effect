import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Spy helpers to allow per-test mocking while keeping imports at the top
import computeRmsLevel from "@/react/lib/audio/computeRmsLevel";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import { ONE } from "@/shared/constants/shared-constants";

import clamp01 from "../clamp01";
import smoothValue from "./smoothValue";
import useSmoothedAudioLevel, { type AudioAnalyser } from "./useSmoothedAudioLevel";

// ensure these imported modules are treated as used (we spy on them at test-time)
void computeRmsLevel;
void clamp01;
void smoothValue;

type ComputeSpy = { mockReturnValue: (value: unknown) => void; mockReset?: () => void };
type ClampSpy = {
	mockImplementation: (...args: readonly unknown[]) => unknown;
	mockReset?: () => void;
};
type SmoothSpy = {
	mockImplementation: (...args: readonly unknown[]) => unknown;
	mockReset?: () => void;
};

// Constants for test values
const BUFFER_SIZE = 1024;
const MOCK_LEVEL = 0.8;
const SMOOTHING_ALPHA = 0.5;
const UI_INTERVAL_MS = 100;
const ZERO_LEVEL = 0;
const MULTIPLIER = 2;

describe("useSmoothedAudioLevel", () => {
	let analyser: AudioAnalyser | undefined = undefined;
	let buffer: Uint8Array<ArrayBuffer> | undefined = undefined;

	async function setup(): Promise<{
		refs: {
			analyserRef: { current: AudioAnalyser | undefined };
			timeDomainBytesRef: { current: Uint8Array<ArrayBuffer> | undefined };
		};
		options: { uiIntervalMs: number; smoothingAlpha: number };
		spies: { mockCompute: ComputeSpy; mockClamp: ClampSpy; mockSmooth: SmoothSpy };
	}> {
		vi.useFakeTimers();
		analyser = {
			getByteTimeDomainData: vi.fn(),
			context: {
				currentTime: 0,
				state: "running",
			},
		};
		buffer = new Uint8Array(BUFFER_SIZE);
		const localRefs = {
			analyserRef: { current: analyser },
			timeDomainBytesRef: { current: buffer },
		};
		const localOptions = { uiIntervalMs: UI_INTERVAL_MS, smoothingAlpha: SMOOTHING_ALPHA };

		// acquire spies at test time so imports can remain at the top
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
		const mockCompute = (await spyImport(
			"@/react/lib/audio/computeRmsLevel",
		)) as unknown as ComputeSpy;
		mockCompute.mockReturnValue(MOCK_LEVEL);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
		const mockClamp = (await spyImport("@/react/lib/audio/clamp01")) as unknown as ClampSpy;
		mockClamp.mockImplementation((value: number) => value);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
		const mockSmooth = (await spyImport(
			"@/react/lib/audio/smooth/smoothValue",
		)) as unknown as SmoothSpy;
		mockSmooth.mockImplementation(
			(prev: number, raw: number, alpha: number) =>
				// Mirror smoothing used in production tests — prefer explicit numeric ops to satisfy lint
				raw * alpha + prev * (ONE - alpha),
		);

		return {
			refs: localRefs,
			options: localOptions,
			spies: { mockCompute, mockClamp, mockSmooth },
		};
	}

	it("initializes with zero levelUiValue", async () => {
		const { refs, options } = await setup();
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		expect(result.current.levelUiValue).toBe(ZERO_LEVEL);
	});

	it("peekSmoothedLevel returns current levelRef value", async () => {
		const { refs, options } = await setup();
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		expect(result.current.peekSmoothedLevel()).toBe(ZERO_LEVEL);
	});

	it("readSmoothedLevelNow reads and smooths level", async () => {
		const { refs, options, spies } = await setup();
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		const level = result.current.readSmoothedLevelNow();
		// assert that the underlying module spies were called
		expect(spies.mockCompute).toHaveBeenCalledWith(buffer);
		expect(spies.mockSmooth).toHaveBeenCalledWith(
			expect.any(Number),
			expect.any(Number),
			SMOOTHING_ALPHA,
		);
		expect(level).toBeGreaterThan(ZERO_LEVEL);
	});

	it("readSmoothedLevelNow returns 0 when analyser unavailable", async () => {
		const { refs, options } = await setup();
		refs.analyserRef.current = undefined;
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		const level = result.current.readSmoothedLevelNow();
		expect(level).toBe(ZERO_LEVEL);
	});

	it("readBytesAndSmoothedLevelNow returns bytes and level", async () => {
		const { refs, options } = await setup();
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		const resultData = result.current.readBytesAndSmoothedLevelNow();
		expect(resultData).toBeDefined();
		expect(resultData?.bytes).toBe(buffer);
		expect(resultData?.level).toBeGreaterThan(ZERO_LEVEL);
	});

	it("readBytesAndSmoothedLevelNow returns undefined when buffer unavailable", async () => {
		const { refs, options } = await setup();
		refs.timeDomainBytesRef.current = undefined;
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		const resultData = result.current.readBytesAndSmoothedLevelNow();
		expect(resultData).toBeUndefined();
	});

	it("stopUiTimer stops updating levelUiValue", async () => {
		const { refs, options } = await setup();
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		result.current.startUiTimer();
		result.current.readSmoothedLevelNow(); // Set level
		result.current.stopUiTimer();

		vi.advanceTimersByTime(options.uiIntervalMs * MULTIPLIER);
		expect(result.current.levelUiValue).toBe(ZERO_LEVEL); // Timer stopped, no update
	});

	it("reset clears state and stops timer", async () => {
		const { refs, options } = await setup();
		const { result } = renderHook(() => useSmoothedAudioLevel(refs, options));
		// cleanup
		vi.useRealTimers();
		vi.clearAllMocks();
		result.current.startUiTimer();
		result.current.readSmoothedLevelNow(); // Change level

		result.current.reset();
		expect(result.current.levelUiValue).toBe(ZERO_LEVEL);
		expect(result.current.peekSmoothedLevel()).toBe(ZERO_LEVEL);
	});

	it("cleanup stops timer on unmount", async () => {
		const { refs, options } = await setup();
		const { result, unmount } = renderHook(() => useSmoothedAudioLevel(refs, options));
		result.current.startUiTimer();

		expect(() => {
			unmount();
		}).not.toThrow();
		vi.useRealTimers();
		vi.clearAllMocks();
	});
});
