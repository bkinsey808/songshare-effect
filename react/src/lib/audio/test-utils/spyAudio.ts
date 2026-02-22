import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

// The tests only rely on a subset of the full `SpyLike` interface, and
// prefer the simpler callback-return types used throughout the repo.  Export
// a local alias so callers don't have to re-declare it.
export type AsyncSpy = {
	mockReturnValue: (value: unknown) => void;
	mockReturnValueOnce: (value: unknown) => void;
	mockResolvedValue: (value: unknown) => void;
	mockResolvedValueOnce?: (value: unknown) => void;
	mockImplementation?: (...args: readonly unknown[]) => unknown;
	mockReset?: () => void;
};

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
