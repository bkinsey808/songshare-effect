import { vi } from "vitest";

import type { SmoothedAudioLevel } from "@/react/lib/audio/smooth/useSmoothedAudioLevel";

let currentMockAudioLevel: SmoothedAudioLevel | undefined = undefined;

// Factory used to create the module mock. Defined so the runtime mock can close over
// the `currentMockAudioLevel` variable.
function makeUseSmoothedAudioLevelMockFactoryInternal(): () => {
	__esModule: true;
	default: (_refs: unknown, _options: unknown) => SmoothedAudioLevel | undefined;
} {
	return (): {
		__esModule: true;
		default: (_refs: unknown, _options: unknown) => SmoothedAudioLevel | undefined;
	} => ({
		__esModule: true,
		default: (_refs: unknown, _options: unknown): SmoothedAudioLevel | undefined =>
			currentMockAudioLevel,
	});
}

/**
 * Apply the `useSmoothedAudioLevel` mock at runtime. Call this inside a test before
 * importing modules that depend on `useSmoothedAudioLevel` so the mock is applied
 * prior to module initialization.
 *
 * @returns void
 */
export function mockUseSmoothedAudioLevel(): void {
	vi.doMock(
		"@/react/lib/audio/smooth/useSmoothedAudioLevel",
		makeUseSmoothedAudioLevelMockFactoryInternal(),
	);
}

/**
 * Configure the mock value returned by the smoothed audio level hook.
 *
 * @param value - Mocked smoothed audio level
 * @returns void
 */
export function setMockUseSmoothedAudioLevel(value: SmoothedAudioLevel | undefined): void {
	currentMockAudioLevel = value;
}

/**
 * Clear the mocked smoothed audio level.
 *
 * @returns void
 */
export function clearMockUseSmoothedAudioLevel(): void {
	currentMockAudioLevel = undefined;
}

/**
 * Create a factory that returns a mock `useSmoothedAudioLevel` function.
 *
 * @returns Factory that produces the mock hook implementation
 */
export function makeUseSmoothedAudioLevelMockFactory(): () => {
	__esModule: true;
	default: (_refs: unknown, _options: unknown) => unknown;
} {
	return makeUseSmoothedAudioLevelMockFactoryInternal();
}
