# Audio Capture Implementation & Debugging

This document outlines the architecture, challenges, and solutions encountered during the implementation of the audio capture system for the Songshare Effect project.

## Overview

The audio system provides real-time audio analysis for various input sources (microphone, display/tab audio, etc.) for use in visualizers. It is built on the Web Audio API and follows a modular structure:

- **`useAudioCapture`**: Low-level hook managing the `AudioContext` and `MediaStream` lifecycle.
- **`useAudioVizInput`**: High-level hook that integrates capture with smoothed level analysis.
- **`createTimeDomainAnalyser`**: Utility to construct the audio graph (Source -> Analyser -> Silent Destination).

---

## Technical Challenges & Solutions

### 1. The "Absolute Silence" Problem

**Symptom**: `AudioContext` was `running`, but all audio samples were exactly `128` (center value), resulting in a 0.0 RMS level. This can occur with any input source if the underlying stream is not providing data.

**Root Causes & Fixes**:

- **Aggressive Browser Filtering**: Default browser settings for `echoCancellation`, `noiseSuppression`, and `autoGainControl` can sometimes filter out all input if they don't detect a clear voice/signal.
  - _Solution_: Explicitly disabled these in `getMicStreamForDevice.ts` (and relevant constraints) for "raw" analysis.
- **Hardware/Stream Warm-up**: Some audio interfaces or virtual streams require a brief "warm-up" period after being initialized by `getUserMedia` or `getDisplayMedia` before they start producing valid data.
  - _Solution_: Introduced a **200ms delay** in `useAudioCapture.ts` after acquiring the stream but before connecting the Web Audio nodes.

### 2. The Initialization Race Condition

**Symptom**: `MediaStreamTrack` was immediately entering the `ended` state upon acquisition, leading to persistent silence.

**Root Cause**:

- **Unstable Callbacks**: Cascading state updates during initialization caused the `stop` callback in `useAudioVizInput` to be recreated.
- **Premature Cleanup**: Consuming components (like the demo page) had `useEffect` cleanups dependent on the `stop` callback. When the callback changed, the cleanup fired, effectively killing the newly created stream before it could be used.

**Solution**:

- **Stable References**: Implemented a `useRef` pattern in `useAudioVizInput.ts` to hold the `stop` function. This decoouples the referential stability of the `stop` callback from the internal state of the capture hook.
- **Arrow Function Properties**: Refactored hook results to use arrow function properties (e.g., `stop: () => Promise<void>`) to avoid `unbound-method` lint errors and ensure stable `this` scoping.

### 3. Audio Continuity

**Symptom**: Audio would occasionally stop or "garbage collect" in some browsers.

**Solution**:

- **Silent Destination**: Connected the `AnalyserNode` to the `audioContext.destination` via a `GainNode` with `0` volume. Some browsers suspend audio nodes if they aren't part of an active output graph.

---

## Testing & Maintenance

- **Minimal Interfaces**: We use `MinimalMediaStream`, `MinimalAnalyserNode`, etc., in `types.ts` to allow for easy mocking in unit tests without requiring full browser globals.
- **Lint Compliance**: The module is strictly compatible with `oxlint` rules, particularly regarding `unbound-method` and React hook dependencies.
