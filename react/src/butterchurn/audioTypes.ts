/**
 * Shared audio-related type definitions for Butterchurn helpers.
 *
 * These types are intentionally compact and focused so they can be imported
 * by each helper implementation (ensureAudioContext, attachMic, attachSystemAudio,
 * stopSystemAudio) without introducing extra runtime dependencies.
 *
 * Use these consistently across modules to avoid duplicated type shapes.
 */

import type { RefObject, Dispatch, SetStateAction } from "react";

/**
 * Generic debug function for emitting runtime debug information.
 * Keep the argument type flexible — callers may pass arbitrary contextual
 * data for logging / telemetry.
 */
export type DebugFn = (...args: unknown[]) => void;

/**
 * A small utility function signature that records a short user-facing
 * error message. The argument is optional so callers can clear previous
 * messages by calling with `undefined`.
 */
export type RecordErrorFn = (message?: string) => void;

/**
 * Options required by helpers that ensure/create an AudioContext instance.
 */
export type EnsureAudioContextOpts = {
  audioContextRef: RefObject<AudioContext | undefined>;
  analyserRef?: RefObject<AnalyserNode | undefined>;
};

/**
 * Options passed to `attachAudioInput`. Encapsulates all references required to
 * manage audio input capture and analyzers.
 */
export type AttachAudioInputOptions = {
  audioContextRef: RefObject<AudioContext | undefined>;
  analyserRef: RefObject<AnalyserNode | undefined>;
  sourceNodeRef: RefObject<
    MediaElementAudioSourceNode | MediaStreamAudioSourceNode | undefined
  >;
  /**
   * Optional device id to select a specific audio input device.
   * When provided, helpers should use this value to request the selected
   * device via getUserMedia({ audio: { deviceId: { exact: deviceId } } }).
   */
  deviceId?: string;
  debug?: DebugFn;
  recordError?: RecordErrorFn;
};

/**
 * Options passed to `attachSystemAudio`. These include an optional audio
 * element reference (used for monitoring playback), the audio context and
 * the analyser, plus a source node + stream references.
 */
export type AttachSystemAudioOptions = {
  audioRef?: RefObject<HTMLAudioElement | null>;
  audioContextRef: RefObject<AudioContext | undefined>;
  analyserRef: RefObject<AnalyserNode | undefined>;
  sourceNodeRef: RefObject<
    MediaElementAudioSourceNode | MediaStreamAudioSourceNode | undefined
  >;
  systemStreamRef?: RefObject<MediaStream | undefined>;
  monitoring?: boolean;
  setSystemCapturing?: Dispatch<SetStateAction<boolean>>;
  debug?: DebugFn;
  recordError?: RecordErrorFn;
};

/**
 * Options passed to `stopSystemAudio()`.
 */
export type StopSystemAudioOptions = {
  audioRef?: RefObject<HTMLAudioElement | null>;
  sourceNodeRef: RefObject<
    MediaElementAudioSourceNode | MediaStreamAudioSourceNode | undefined
  >;
  systemStreamRef?: RefObject<MediaStream | undefined>;
  setSystemCapturing?: Dispatch<SetStateAction<boolean>>;
  recordError?: RecordErrorFn;
  debug?: DebugFn;
};
