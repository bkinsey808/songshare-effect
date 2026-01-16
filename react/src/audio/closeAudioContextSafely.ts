/**
 * Close an `AudioContext` and ignore any errors thrown by the close operation.
 *
 * Some browsers may throw when closing (for example if already closed); this
 * helper ensures the caller does not need to handle those errors.
 *
 * @param audioContext - The `AudioContext` instance to close.
 * @returns A promise that resolves once the close attempt completes.
 */
export default async function closeAudioContextSafely(audioContext: AudioContext): Promise<void> {
	await audioContext.close().catch(() => {
		// ignore
	});
}
