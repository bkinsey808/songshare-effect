import type { AsyncSpy as SharedAsyncSpy } from "@/shared/types/AsyncSpy.type";

import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

// Re-expose the shared `AsyncSpy` type under the same local name so existing
// imports that reference `spyAudio` keep working.
export type AsyncSpy = SharedAsyncSpy;

// Helpers for dynamically importing the modules under test.  These live in a
// non-test file so that we can safely include the necessary `as unknown as`
// casts without tripping the `no-disable-in-tests` rule.
export function spyUseAudioCapture(): Promise<AsyncSpy> {
	// generic invocation removes the need for any unsafe assertions.
	return spyImport<AsyncSpy>("@/react/lib/audio/useAudioCapture");
}

export function spyUseSmoothedAudioLevelRef(): Promise<AsyncSpy> {
	return spyImport<AsyncSpy>("@/react/lib/audio/smooth/useSmoothedAudioLevelRef");
}
