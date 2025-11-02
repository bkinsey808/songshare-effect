# Fix: Vite / react-babel transform error in HydratedLayout (OAuth flash work)

Date: 2025-11-02

This note explains the runtime/build issue we hit while implementing a small UI mitigation for the OAuth redirect flash and the exact fixes I made.

## Problem summary

- Symptom: When running the dev server (Vite + react-compiler), the dev server would hang with an error from the babel-plugin-react-compiler (shown as a Vite internal server error). The error message was:

  "Todo: Support value blocks (conditional, logical, optional chaining, etc) within a try/catch statement"

- The runtime symptom on the app side was an intermittent flash of the Home page during OAuth redirect back from the provider (the motivation for the change). While instrumenting and patching the client, the transform error prevented Vite from compiling, which made development difficult and appeared like a hang in the dev server.

## Root cause

- The project uses the React Compiler plugin (babel-plugin-react-compiler / react-compiler) which has a limitation about "value blocks" (complex conditionals or optional chaining expressions) when they appear inside a `try/catch` block in certain positions. The plugin throws a TODO error rather than silently allowing the code.
- The relevant code in `react/src/App.tsx` had logical/conditional expressions inside `try { ... }` and used a ternary expression to compute a debug string inside that `try`. Both patterns triggered the transform error.

## What I changed (high level)

- Files edited:
  - `react/src/App.tsx` — main fix (see details below).
  - `react/src/auth/signinPending.ts` and `react/src/auth/useSignIn.ts` — earlier changes added safe, build-friendly debug logging and small behavioral tweaks; they remain in place.

- Key fixes applied to `react/src/App.tsx`:
  1. Avoided value blocks inside `try/catch`: computed complex boolean expressions before the try block and used a simple `if (waitForAuth)` inside the `try`. This prevents the plugin from encountering unsupported constructs.
  2. Removed ternary expression inside `try` and replaced it by assigning a local `resultStr` via a plain `if` statement before logging. That eliminated the conditional value block the plugin complained about.
  3. Replaced an `any` cast for the debug flag with a safer typed access: `(globalThis as unknown as { __SONGSHARE_DEBUG__?: boolean }).__SONGSHARE_DEBUG__` (and formatted it to satisfy linters).
  4. Added an explicit typed `delay(ms): Promise<void>` helper and gave the async helper function an explicit `Promise<void>` return type to satisfy TypeScript and code-style rules.
  5. Removed unused `catch (e)` identifier (use `catch {}`) to satisfy lint rules about short/unused identifiers.

## Why these changes fix the problem

- The React Compiler plugin's code-path that produced the TODO is triggered when it finds complex value expressions in certain AST positions; by simplifying expressions and computing them outside of `try/catch`, we avoid that code-path entirely. The plugin can then emit code normally and the dev server will compile the module without error.

## Debugging additions (already present)

- I added lightweight debug logging (guarded by `window.__SONGSHARE_DEBUG__`) at these points to collect precise timestamps during sign-in flows:
  - `setSigninPending` / `clearSigninPending` (in `react/src/auth/signinPending.ts`)
  - `HydratedLayout` decisions: computed `shouldRemoveHide`, `waiting for ensureSignedIn`, `ensureSignedIn race result`, `removing hide element` (in `react/src/App.tsx`)
  - `useSignIn` store subscription logs (in `react/src/auth/useSignIn.ts`)

## How to reproduce the build error (before the fix)

1. Run the frontend dev server:

```bash
npm run dev:client
```

2. Vite would show the react-babel pre-transform error and the server would fail to serve the module.

## How to verify the fix

1. Start the dev server:

```bash
npm run dev:client
```

2. Confirm Vite starts and serves the app (you should see the usual Local URLs like https://127.0.0.1:5173/ and no pre-transform errors in the terminal).

3. In the browser DevTools Console, enable the debug flag and preserve log:

```js
window.__SONGSHARE_DEBUG__ = true;
// enable Preserve log in DevTools and reproduce the OAuth sign-in redirect
```

4. Reproduce the OAuth flow (with your slow-3G throttling if you want to stress it) and check the `songshare-debug` console lines for ordering.

## Notes and follow-ups

- The underlying UX issue (flash during OAuth) may have several causes: the SPA showing the wrong route while the browser applies the Set-Cookie header, the client making `/api/me` requests before the cookie is available, or cached/Service-Worker serving stale HTML. The code changes we made are defensive: they centralize hide/unhide behavior and wait briefly for authentication to be detected.
- If you still see the flash in slow networks, upload the debug console output (the `songshare-debug` lines) and I will analyze timestamps and implement either a short poll-to-success (fast backoff) or a minimal server-side redirect page that sets the cookie and then client-side navigates — whichever is least intrusive.
- Recommend running a quick lint and build to surface other transform-hostile patterns:

```bash
npm run lint
npm run build
```

If you want I can run those here and fix any other occurrences of value-blocks inside try/catch blocks.

## Appendix: files changed (short)

- `react/src/App.tsx` — moved complex expressions out of try, added typed delay, replaced ternary, added safe debug flag access.
- `react/src/auth/signinPending.ts` — added safe debug-guarded console logs for set/clear/removeHide.
- `react/src/auth/useSignIn.ts` — added debug logs for store changes and fallback timers.

If you want this written as part of the project's CHANGELOG or included in a PR description, tell me which file/location and I will copy this note there.
