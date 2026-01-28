import { vi } from "vitest";

import type { SmoothedAudioLevel } from "@/react/audio/useSmoothedAudioLevel";

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
 */
export function mockUseSmoothedAudioLevel(): void {
	vi.doMock("@/react/audio/useSmoothedAudioLevel", makeUseSmoothedAudioLevelMockFactoryInternal());
}

// Exports (kept at the end of the file per lint rules)
export function setMockUseSmoothedAudioLevel(value: SmoothedAudioLevel | undefined): void {
	currentMockAudioLevel = value;
}

export function clearMockUseSmoothedAudioLevel(): void {
	currentMockAudioLevel = undefined;
}

export function makeUseSmoothedAudioLevelMockFactory(): () => {
	__esModule: true;
	default: (_refs: unknown, _options: unknown) => unknown;
} {
	return makeUseSmoothedAudioLevelMockFactoryInternal();
}
