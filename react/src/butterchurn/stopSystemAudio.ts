/**
 * stopSystemAudio helper
 *
 * Single-export file that stops system audio capture and performs any
 * necessary cleanup of the analyser/source nodes and media tracks.
 *
 * This implementation accepts the same options shape used by the other audio
 * helpers and performs best-effort cleanup without throwing.
 */

import type { StopSystemAudioOptions } from "./audioTypes";

export default function stopSystemAudio({
  audioRef,
  sourceNodeRef,
  systemStreamRef,
  setSystemCapturing,
  recordError,
  debug,
}: StopSystemAudioOptions): void {
  if (sourceNodeRef.current) {
    try {
      sourceNodeRef.current.disconnect();
    } catch (error) {
      void error;
    }
    sourceNodeRef.current = undefined;
  }

  const sysStream = systemStreamRef?.current;
  if (sysStream !== undefined) {
    for (const t of sysStream.getTracks()) {
      try {
        t.stop();
      } catch (error) {
        void error;
      }
    }
    if (systemStreamRef) {
      systemStreamRef.current = undefined;
    }
  }

  if (audioRef?.current) {
    try {
      // reset audio element source so playback/stream visually ends
      audioRef.current.src = "";
      audioRef.current.load();
    } catch (error) {
      void error;
    }
  }

  // Clear any recorded error and inform callers that system capture has stopped
  recordError?.(undefined);
  setSystemCapturing?.(false);
  debug?.("stopSystemAudio: stopped and cleared system capture");
}
