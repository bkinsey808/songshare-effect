# Butterchurn Troubleshooting & Options ✅

**Purpose:** Document the diagnosed issue, consolidate possible fixes/workarounds, and provide step-by-step instructions + a prioritized checklist to get visuals rendering reliably in the app.

---

## TL;DR 💡
- The Butterchurn export currently yields a *class-like* symbol that our runtime cannot instantiate into a usable visualizer instance (factory throws "Cannot call a class as a function"; constructor attempts produce objects missing `render` / `connectAudio`).
- Likely cause: bundler/interop mismatch between the package's UMD/CJS build and our ESM/Vite environment.
- Fastest reliable workaround: **vendor the UMD build and use a global adapter** (low risk, high payoff). Longer-term: fix bundler config or open upstream issue for an ESM-friendly export.

---

## Background 🔍
- Repro artifacts in repo:
  - Debug script: `scripts/debug-butterchurn-network.bun.ts` (calls factory + several constructor signatures and reports summary)
  - E2E spec with diagnostics: `e2e/inspect-butterchurn.spec.ts` (measures audio RMS, canvas sampling, render-active flag)
  - Runtime instantiation helper: `react/src/butterchurn/visualizerHelpers.ts` (deterministic attempts + instance validation)
- Observed behavior: audio RMS > 0 (audio present); visualizer never renders. Console shows repeated fallbacks and final message: "Failed to instantiate butterchurn visualizer via constructor (no matching signature)".

---

## Options & Tradeoffs (ordered) 🔧

### 1) Vendor the UMD build and use the global (Fast / Robust) ✅
- What: Add the library's UMD bundle to `public/vendor/` and load it with a `<script>` tag; write a small adapter that reads from `window` and returns an instance with `render`, `connectAudio`, etc.
- Why: Bypasses bundler interop and reproduces the build shape the library author intended for browsers.
- Pros: Quick to implement and verify (good for demos / immediate fixes).
- Cons: Global script is less modern; needs review for production usage.

**Example adapter**
```ts
// react/src/butterchurn/adapter.ts
const bc = (window as any).butterchurn;
export function createVisualizerFromGlobal(canvas: HTMLCanvasElement, audioCtx: AudioContext, opts = {}) {
  // UMD may expose createVisualizer or Visualizer constructor depending on build
  if (typeof bc?.createVisualizer === 'function') return bc.createVisualizer(canvas, opts);
  if (typeof bc?.Visualizer === 'function') return new bc.Visualizer(canvas, opts);
  throw new Error('Vendor butterchurn global is not present or in unexpected shape');
}
```

### 2) Try importing the library differently / fix Vite commonjsOptions (Preferred clean fix) 🔧
- Try `import * as bc from 'butterchurn/lib/butterchurn.js'` or dynamic `await import(...)`.
- Update `vite.config.ts`:
```ts
optimizeDeps: { include: ['butterchurn'] },
build: { commonjsOptions: { include: [/node_modules/] } }
```
- Rationale: Some CJS/UMD builds require forced CJS handling or an explicit path into the packaged `lib/` tree.

### 3) Test different versions or fork & rebuild (Moderate effort) 🔁
- Try older/newer versions of `butterchurn` to find one with an export shape that works.
- Alternatively fork and add an ESM build/entry if upstream is unmaintained.

### 4) Add a local shim (moderate to high effort) 🧩
- If the library's internal `Visualizer` function is accessible in `node_modules`, write a small shim module that imports the necessary internals and re-exports a compatible factory/constructor.
- Harder to maintain; use as last resort.

### 5) Add UX fallback (low effort, immediate) 🎨
- Show a helpful message or a small fallback animation when a visualizer cannot be created.
- Avoids a blank canvas for users while a permanent fix is chosen.

---

## Repro Steps (how to capture diagnostics) 🧪
1. Run debug script (produces JSON createInspect output):
```bash
npx bun ./scripts/debug-butterchurn-network.bun.ts
```
2. Run the targeted e2e spec:
```bash
PLAYWRIGHT_BASE_URL=https://127.0.0.1:5173 npx playwright test e2e/inspect-butterchurn.spec.ts --project=chromium
```
3. Inspect `console` logs for `butterchurn` diagnostics (the code logs candidate shapes and final error messages)

---

## Suggested immediate plan & checklist ✅
| # | Task | Owner | Status |
|---|------|-------|--------|
| 1 | Add `docs/butterchurn-troubleshooting.md` (this doc) | @repo | done |
| 2 | Implement vendor UMD shim in `public/vendor/` + `react/src/butterchurn/adapter.ts` | @repo | not-started |
| 3 | Add e2e test for vendor shim rendering | @repo | not-started |
| 4 | Try Vite import experiments & tests | @repo | not-started |
| 5 | Draft & open upstream issue (attach debug JSON and e2e logs) | @repo | not-started |
| 6 | Add a small UX fallback message / animation | @repo | not-started |

---

## What I can do next (pick one) ▶️
- Implement the **vendor UMD shim** and add a verification e2e (fast path) — recommended first step.


### Vendor shim trial (implemented) ⚠️
- Action: Copied the UMD bundle to `public/vendor/butterchurn.js`, loaded it in `index.html`, and updated `useButterchurnVisualizer` to prefer the UMD global when present. Added `e2e/inspect-butterchurn-vendor.spec.ts` to exercise the vendor path.
- Result: The vendor global is available, but direct instantiation still fails with the same runtime error observed earlier: "TypeError: Cannot call a class as a function" when calling `createVisualizer` or attempting constructor-based instantiation. Audio RMS was measurable in other flows but not in this simplified vendor test.
- Conclusion: Vendoring the UMD build did not resolve the underlying instantiation mismatch; this points to an incompatibility in how the library's class/constructor is being invoked in our runtime (possibly due to transpilation or loader interop semantics).
- Next step: open an upstream issue including the debug JSON from `scripts/debug-butterchurn-network.bun.ts`, the `e2e/inspect-butterchurn.spec.ts` diagnostics, and the new vendor test output. Also proceed with Vite/commonjs import experiments as a parallel investigation.
- Or, attempt the **Vite import tweaks** to get an ESM-friendly import (cleaner, may take more trial & error).

---

## Appendices
- Related files:
  - `scripts/debug-butterchurn-network.bun.ts`
  - `e2e/inspect-butterchurn.spec.ts`
  - `react/src/butterchurn/visualizerHelpers.ts`
- Useful note for upstream: include the debug JSON (`scripts/debug-butterchurn-network`), e2e logs, and the exact runtime environment (`vite` + node/module versions).

---

If you want, I can implement the vendor UMD shim next and add a quick e2e to verify visuals render — tell me to proceed and I’ll add the adapter + test. 🔧✅
