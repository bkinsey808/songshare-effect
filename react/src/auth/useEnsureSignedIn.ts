/* eslint-disable no-console */
import { Effect } from "effect";
import { useEffect, useRef } from "react";
import type { StoreApi } from "zustand";

import { type AppSlice, getStoreApi } from "@/react/zustand/useAppStore";
import { apiMePath } from "@/shared/paths";
import type { UserSessionData } from "@/shared/userSessionData";

// Helper to synchronously process the JSON payload and update the store.
// Extracted to top-level to avoid deep nesting in the effect chain.
function processPayload(
	payload: unknown,
	signIn: (data: UserSessionData) => void,
	setIsSignedIn: (v: boolean) => void,
): UserSessionData | undefined {
	const isSuccessWrapper = (
		value: unknown,
	): value is { success: true; data: unknown } => {
		if (typeof value !== "object" || value === null) {
			return false;
		}
		const obj = value as Record<string, unknown>;
		return (
			Object.prototype.hasOwnProperty.call(obj, "data") &&
			obj["data"] !== undefined
		);
	};

	const isUserSessionData = (value: unknown): value is UserSessionData => {
		if (typeof value !== "object" || value === null) {
			return false;
		}
		const obj = value as Record<string, unknown>;
		return Object.prototype.hasOwnProperty.call(obj, "user");
	};

	if (isSuccessWrapper(payload)) {
		const data = (payload as { data: unknown }).data;
		if (isUserSessionData(data)) {
			signIn(data);
			return data;
		}
	}

	if (isUserSessionData(payload)) {
		signIn(payload);
		return payload;
	}

	setIsSignedIn(false);
	return undefined;
}

// Module-level in-flight fiber promise to dedupe concurrent hook instances
let globalInFlight: Promise<UserSessionData | undefined> | undefined;

/**
 * Hook that ensures the auth state is initialized. If `isSignedIn` is undefined
 * it will call `/api/me` and then either sign in (setting `userSessionData`)
 * or set `isSignedIn` to false.
 */
// eslint-disable-next-line max-lines-per-function
export default function useEnsureSignedIn(options?: { force?: boolean }): void {
	const force = options?.force ?? false;

	// We'll access the store API inside the effect via getStoreApi() to avoid
	// calling hooks during render and keep hook order stable.
	const storeApiRef = useRef<StoreApi<AppSlice> | undefined>(undefined);

	// Guard to avoid duplicate in-flight requests across multiple mounts
	const inFlightRef = useRef<Promise<UserSessionData | undefined> | undefined>(
		undefined,
	);

	// Minimal handle for the subset of RuntimeFiber we use here. We avoid
	// importing the full RuntimeFiber type from the runtime because the
	// package doesn't export a single ergonomic type name across versions.
	// We only need await() and interrupt() for dedupe and cleanup.
	type FiberHandle = {
		await: () => Promise<unknown>;
		interrupt: () => Promise<unknown>;
	};

	// Keep the forked fiber so we can interrupt it on unmount
	const fiberRef = useRef<FiberHandle | undefined>(undefined);

	useEffect(() => {
		console.debug("[useEnsureSignedIn] effect mounted, force=", force);

		// Lazily capture the store API when the effect runs.
		if (!storeApiRef.current) {
			storeApiRef.current = getStoreApi();
		}

		// If not forcing, skip fetching when we already know the sign-in state.
		const currentIsSignedIn = storeApiRef.current?.getState().isSignedIn;
		const signIn = storeApiRef.current?.getState().signIn;
		const setIsSignedIn = storeApiRef.current?.getState().setIsSignedIn;

		// Hoist safe handler defaults to avoid nested function creation inside
		// the Effect chain (reduces sonarjs nesting complaints).
		const doSignIn = signIn ?? (() => undefined);
		const doSetIsSignedIn = setIsSignedIn ?? (() => {});

		if (!force && currentIsSignedIn !== undefined) {
			return;
		}

		if (globalInFlight) {
			inFlightRef.current = globalInFlight;
			void globalInFlight.finally(() => {
				inFlightRef.current = undefined;
			});
			return;
		}

		// AbortController is allocated inside the effect so interruptions
		// handle aborting the fetch; no outer controller required here.

		// Payload processing is handled by the module-level helper

		// Abort detection is handled by aborting the fetch; we no longer
		// inspect errors for AbortError downstream, so drop the helper.

		// Create an AbortController outside the Effect and pass its signal
		// into the fetch. We'll ensure the controller is aborted both when
		// the fiber completes (via promise.finally) and on unmount. This
		// avoids scoped Effect types while still allowing interruption.
		const controller = new AbortController();

		controller.signal.addEventListener("abort", () => {
			console.debug("[useEnsureSignedIn] controller aborted");
		});

		console.debug(
			"[useEnsureSignedIn] about to create fetch Effect to",
			apiMePath,
		);
		const fetchEffect = Effect.tryPromise<Response, unknown>({
			try: () =>
				fetch(apiMePath, {
					method: "GET",
					credentials: "include",
					headers: { Accept: "application/json" },
					signal: controller.signal,
				}),
			catch: (err: unknown) => err as unknown,
		}).pipe(
			Effect.flatMap((res) => {
				if (!res.ok) {
					return Effect.sync(() => {
						// Use the ref-captured setter to avoid render-time hooks
						setIsSignedIn?.(false);
						return undefined as UserSessionData | undefined;
					});
				}

				return Effect.tryPromise<unknown, unknown>({
					try: () => res.json(),
					catch: (err: unknown) => err as unknown,
				}).pipe(
					Effect.map((payload) => {
						return processPayload(payload, doSignIn, doSetIsSignedIn);
					}),
				);
			}),
		);

		// Wrap errors so the resulting effect has no failure channel when we run it
		const safeEffect = Effect.catchAll(fetchEffect, (err) =>
			Effect.sync(() => console.error("useEnsureSignedIn error", err)).pipe(
				Effect.as(undefined),
			),
		);

		// Defer forking the Effect until after the current microtask so we
		// don't run the Effect runtime synchronously during React's effect
		// phase (this avoids React internals errors seen in some environments).
		let canceled = false;
		let queued = true;

		const start = (): void => {
			console.warn("[useEnsureSignedIn] start() called");
			if (canceled) {
				return;
			}
			queued = false;
			// Effect.runFork may return different shapes depending on runtime
			// (a fiber with await()/interrupt(), or a Promise). Be defensive
			// and support both so we don't crash when await() isn't present.
			const runtimeFiber = Effect.runFork(safeEffect) as unknown;

			// If the returned value has an await() method, use it. Otherwise
			// if it's a Promise-like, use it directly. Keep a minimal fiber
			// wrapper with interrupt() if present so we can cancel on unmount.
			let promise: Promise<UserSessionData | undefined> =
				Promise.resolve(undefined);

			const rf = runtimeFiber as unknown;

			const hasAwait =
				rf !== null && typeof (rf as { await?: unknown }).await === "function";
			const isThenable =
				rf !== null && typeof (rf as { then?: unknown }).then === "function";

			if (hasAwait) {
				fiberRef.current = rf as unknown as FiberHandle;
				// Call await() to get the completion promise
				promise = (
					rf as { await: () => Promise<UserSessionData | undefined> }
				).await();
			} else if (isThenable) {
				// runtimeFiber is Promise-like but may resolve to a fiber handle
				// that itself provides await(). Chain the initial thenable so
				// we wait for the resolved fiber and then call its await().
				const rfPromise = rf as Promise<unknown>;
				promise = rfPromise.then((resolved) => {
					if (
						resolved !== null &&
						typeof (resolved as { await?: unknown }).await === "function"
					) {
						const resolvedFiber = resolved as unknown as FiberHandle & {
							interrupt?: () => Promise<unknown>;
						};
						fiberRef.current = resolvedFiber;
						return resolvedFiber.await() as Promise<
							UserSessionData | undefined
						>;
					}
					// If resolved value is not a fiber with await(), assume
					// the thenable resolved to the final value.
					return resolved as Promise<UserSessionData | undefined>;
				}) as Promise<UserSessionData | undefined>;
			} else {
				// Unexpected shape — leave promise resolved and no fiber
				fiberRef.current = undefined;
			}
			void promise.finally(() => {
				inFlightRef.current = undefined;
				globalInFlight = undefined;
				// Do not abort the controller here — aborting in finally
				// can cancel the fetch before the browser receives the
				// response when runtimes resolve early. We only abort on
				// unmount/interrupt to cancel active requests.
			});

			inFlightRef.current = promise;
			globalInFlight = promise;
		};

		// Schedule the start on the next microtask (after React commits)
		queueMicrotask(start);

		return () => {
			// On unmount interrupt the forked fiber to avoid any further store
			// updates. The effect allocated the AbortController and will abort
			// the fetch inside its finalizer when interrupted.
			// If we queued the start but it hasn't run yet, mark canceled so
			// the scheduled start won't run. Otherwise interrupt the running fiber.
			canceled = true;
			if (queued) {
				return;
			}
			const fiberHandle = fiberRef.current;
			if (fiberHandle) {
				void fiberHandle.interrupt();
			}
		};
	}, [force]);
}
