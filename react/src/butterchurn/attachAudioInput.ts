// songshare-effect/react/src/butterchurn/attachAudioInput.ts
/**
 * attachAudioInput helper
 *
 * Single-export file that attaches the selected audio input device (microphone,
 * virtual cable, etc.) as an audio source using the provided AudioContext and
 * AnalyserNode references.
 *
 * The function returns `true` when audio capture is successfully attached
 * to the provided analyser node, and `false` on errors or user denial.
 *
 * This file uses the shared types in `audioTypes.ts` and the `ensureAudioContext`
 * helper to create or reuse the project's AudioContext instance.
 */

import type { AttachAudioInputOptions } from "./audioTypes";
import ensureAudioContext from "./ensureAudioContext";

/**
 * Attach the selected audio input as a source to the given analyser (via audio context).
 * Returns true when audio input was successfully attached, false otherwise.
 */
export default async function attachAudioInput({
  audioContextRef,
  analyserRef,
  sourceNodeRef,
  recordError,
  debug,
  deviceId,
}: AttachAudioInputOptions): Promise<boolean> {
  let stream: MediaStream | undefined = undefined;
  try {
    // If a specific device id was provided, prefer that device for capture
    // (useful for virtual loopback devices - e.g., BlackHole, VB-Audio).
    const constraints = deviceId !== undefined && deviceId !== "" ? { audio: { deviceId: { exact: deviceId } } } : { audio: true };
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    debug?.("attachAudioInput: getUserMedia failed", error);
    recordError?.("Microphone access failed or was denied.");
    return false;
  }

  let audioContext: AudioContext | undefined = undefined;
  try {
    audioContext = ensureAudioContext({ audioContextRef, analyserRef });
  } catch (error) {
    debug?.("attachMic: ensureAudioContext failed", error);
    recordError?.("AudioContext creation failed");
    return false;
  }

  if (audioContext === undefined) {
    recordError?.("AudioContext unavailable");
    return false;
  }

  // Disconnect and clear previous source node (if any)
  if (sourceNodeRef.current) {
    try {
      sourceNodeRef.current.disconnect();
    } catch (error) {
      // Ignore disconnection errors — we're trying to remove any stale node.
      void error;
    }
    sourceNodeRef.current = undefined;
  }

  // Create a media stream source from the microphone stream
  const micSource = audioContext.createMediaStreamSource(stream);

  // Ensure we have an analyser node to connect to
  if (!analyserRef.current) {
    try {
      const createdAnalyser = audioContext.createAnalyser();
      createdAnalyser.fftSize = 2048;
      analyserRef.current = createdAnalyser;
    } catch (error) {
      debug?.("attachMic: createAnalyser failed", error);
      recordError?.("Analyser creation failed");
      return false;
    }
  }

  const analyserNode = analyserRef.current;
  if (analyserNode === undefined) {
    recordError?.("Analyser node unavailable");
    return false;
  }

  // Connect the microphone source to the analyser and keep a reference to the source node
  try {
    micSource.connect(analyserNode);
    sourceNodeRef.current = micSource;
  } catch (error) {
    debug?.("attachAudioInput: connect failed", error);
    recordError?.("Failed to connect audio input to analyser");
    return false;
  }

  return true;
}
