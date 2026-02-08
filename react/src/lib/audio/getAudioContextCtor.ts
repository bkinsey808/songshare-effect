/**
 * Retrieve the global `AudioContext` constructor if available.
 *
 * @returns The `AudioContext` constructor or `undefined` if not supported in the runtime.
 */
export default function getAudioContextCtor(): typeof AudioContext | undefined {
	return Reflect.get(globalThis, "AudioContext") as typeof AudioContext | undefined;
}
