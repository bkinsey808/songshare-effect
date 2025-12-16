/**
 * attachSystemAudio helper
 *
 * Single-export file that attaches system/tab audio via getDisplayMedia
 * to the provided AudioContext and Analyser.
 *
 * This helper performs graceful error handling and returns `true` when a
 * system capture stream has been successfully attached to the analyser node,
 * otherwise `false`.
 */

import ensureAudioContext from "./ensureAudioContext";
import stringifyUnknown from "@/react/utils/stringifyUnknown";
import type { AttachSystemAudioOptions } from "./audioTypes";

export default async function attachSystemAudio({
  audioRef,
  audioContextRef,
  analyserRef,
  sourceNodeRef,
  systemStreamRef,
  monitoring = false,
  setSystemCapturing,
  recordError,
  debug,
}: AttachSystemAudioOptions): Promise<boolean> {
  if (typeof navigator.mediaDevices?.getDisplayMedia !== "function") {
    recordError?.("System audio capture is not supported by this browser.");
    return false;
  }

  let stream: MediaStream | undefined = undefined;
  try {
    // Try audio-only display capture first; some browsers may not support it and
    // will throw NotSupportedError, in which case retry with video enabled so the
    // capture dialog appears and the user can opt into "share audio".
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: false });
    } catch (error) {
      if (
        error !== null &&
        typeof error === "object" &&
        "name" in error &&
        (error as Record<string, unknown>)["name"] === "NotSupportedError"
      ) {
        stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
      } else {
        // Re-throw so the generic error mapping below can run.
        throw error;
      }
    }
  } catch (error) {
    debug?.("attachSystemAudio: getDisplayMedia failed", error);
    // Map a few common capture errors into useful messages.
    let errName: string | undefined = undefined;
    if (error !== null && typeof error === "object" && "name" in error) {
      const val = (error as Record<string, unknown>)["name"];
      if (typeof val === "string") {
        errName = val;
      }
    }
    if (errName === "NotAllowedError" || errName === "SecurityError") {
      recordError?.(
        "Screen capture or system audio permission denied. Please allow screen sharing and enable 'Share audio' in the capture dialog.",
      );
    } else if (errName === "NotFoundError") {
      recordError?.(
        "No display or audio capture device is available. Try selecting a different window/tab or checking your system/audio settings.",
      );
    } else if (errName === "NotSupportedError") {
      recordError?.(
        "System/tab audio capture is not supported in this browser or context. Try a different browser (Chrome/Chromium) or enable audio in the capture dialog.",
      );
    } else {
      const msg = stringifyUnknown(error ?? "Screen capture or system audio permission denied.");
      recordError?.(msg);
    }
    // Keep a console warning available for diagnostics
    console.warn(error);
    return false;
  }

  if (stream === undefined) {
    recordError?.("Screen capture denied or unavailable.");
    return false;
  }

  let audioContext: AudioContext | undefined = undefined;
  try {
    audioContext = ensureAudioContext({ audioContextRef, analyserRef });
  } catch (error) {
    debug?.("attachSystemAudio: ensureAudioContext failed", error);
    recordError?.("Analyser node unavailable");
    return false;
  }

  if (audioContext === undefined) {
    recordError?.("AudioContext unavailable");
    return false;
  }

  // Remove previous source node (if any)
  if (sourceNodeRef.current) {
    try {
      sourceNodeRef.current.disconnect();
    } catch (error) {
      void error;
    }
    sourceNodeRef.current = undefined;
  }

  let sysSource: MediaStreamAudioSourceNode | undefined = undefined;
  try {
    // Create a stream that contains only the audio tracks for the analyser node.
    // Some environments return both audio and video tracks; we only want the audio track
    // for the analyser source.
    const audioOnlyStream = new MediaStream(stream.getAudioTracks());
    sysSource = audioContext.createMediaStreamSource(audioOnlyStream);
  } catch (error) {
    debug?.("attachSystemAudio: createMediaStreamSource failed", error);
    recordError?.("Failed to create MediaStream source");
    return false;
  }
  if (sysSource === undefined) {
    recordError?.("Failed to create MediaStream source");
    return false;
  }

  if (!analyserRef.current) {
    try {
      const createdAnalyser = audioContext.createAnalyser();
      createdAnalyser.fftSize = 2048;
      analyserRef.current = createdAnalyser;
    } catch (error) {
      debug?.("attachSystemAudio: createAnalyser failed", error);
      recordError?.("Failed to create analyser node");
      return false;
    }
  }

  const analyserNode = analyserRef.current;
  if (analyserNode === undefined) {
    recordError?.("Analyser node unavailable");
    return false;
  }

  try {
    sysSource.connect(analyserNode);
    sourceNodeRef.current = sysSource;
    if (systemStreamRef) {
      systemStreamRef.current = stream;
    }

    // Resume the AudioContext if it started in a suspended state (common
    // in browsers that require a user gesture). This ensures the analyser
    // receives live audio data even when the context was auto-suspended.
    try {
      void audioContext.resume?.();
    } catch (error) {
      debug?.("attachSystemAudio: audioContext.resume failed", error);
    }

    setSystemCapturing?.(true);
  } catch (error) {
    debug?.("attachSystemAudio: connect failed", error);
    recordError?.("Failed to attach system audio to analyser");
    return false;
  }

  if (audioRef?.current) {
    try {
      audioRef.current.srcObject = stream;
      if (monitoring) {
        try {
          void audioRef.current.play();
        } catch {
          // best-effort: ignore autoplay failure
        }
      }
    } catch (error) {
      debug?.("attachSystemAudio: attach to audio element failed", error);
    }
  }

  return true;
}
