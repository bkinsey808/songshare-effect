import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import type { AsyncSpy as SharedAsyncSpy } from "@/shared/types/AsyncSpy.type";

// Re-expose the shared `AsyncSpy` type under the same local name so existing
// imports that reference `spyAudio` keep working.
export type AsyncSpy = SharedAsyncSpy;

/**
 * Create a spy handle for the `useAudioCapture` module export.
 *
 * This helper lives outside test files so callers do not need repeated
 * disable comments for the localized casting inside the spy helper.
 *
 * @returns A promise that resolves to the imported async spy.
 */
export function spyUseAudioCapture(): Promise<AsyncSpy> {
	// generic invocation removes the need for any unsafe assertions.
	return spyImport<AsyncSpy>("@/react/lib/audio/useAudioCapture");
}

/**
 * Create a spy handle for the `useSmoothedAudioLevelRef` module export.
 *
 * @returns A promise that resolves to the imported async spy.
 */
export function spyUseSmoothedAudioLevelRef(): Promise<AsyncSpy> {
	return spyImport<AsyncSpy>("@/react/lib/audio/smooth/useSmoothedAudioLevelRef");
}
