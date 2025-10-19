import { Effect } from "effect";
import { useEffect } from "react";
import {
	Navigate,
	Outlet,
	useNavigate,
	useParams,
	useSearchParams,
} from "react-router-dom";

import useEnsureSignedIn from "@/react/auth/useEnsureSignedIn";
import { useAppStore } from "@/react/zustand/useAppStore";
import { defaultLanguage } from "@/shared/language/supportedLanguages";
import { apiMePath } from "@/shared/paths";
import { SigninErrorToken } from "@/shared/signinTokens";

// Layout that protects child routes and redirects unauthenticated users.
export default function ProtectedLayout(): ReactElement {
	// Detect whether we were redirected here from the OAuth callback.
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const justSignedIn = searchParams.get("justSignedIn") === "1";

	// Ensure auth is initialized; force when redirected from OAuth callback.
	useEnsureSignedIn({ force: justSignedIn });

	// Make a stable string representation of the search params so we can
	// safely use it in hook dependency arrays without relying on object
	// identity.
	const searchParamsString = searchParams.toString();

	useEffect(() => {
		if (!justSignedIn) {
			return;
		}

		const controller = new AbortController();
		const next = new URLSearchParams(searchParamsString);
		next.delete("justSignedIn");

		// Always use the proxied API path so Vite's dev proxy handles requests
		// to the API during local development (keeps frontend on :5173).
		const meUrl = apiMePath;

		const fetchEffect = Effect.tryPromise<Response, unknown>({
			try: () =>
				fetch(meUrl, { credentials: "include", signal: controller.signal }),
			catch: (err: unknown) => err as unknown,
		}).pipe(
			Effect.flatMap((res) => {
				if (res.status === 401) {
					return Effect.sync(() => {
						next.set("signinError", SigninErrorToken.cookiesDisabled);
					}).pipe(Effect.as(undefined));
				}
				return Effect.succeed(undefined as void);
			}),
			// Treat AbortError as a normal cleanup event — don't surface it as a
			// server error or set the signinError token. Other errors continue
			// to be treated as server errors.
			Effect.catchAll((err) => {
				// DOMException name may be 'AbortError' in browsers; in some runtimes
				// the thrown error can be a simple object/string. Be defensive.
				const isAbort =
					typeof err === "object" &&
					err !== null &&
					"name" in err &&
					(err as { name?: unknown }).name === "AbortError";
				if (isAbort) {
					// No-op on abort during cleanup.
					return Effect.succeed(undefined as void);
				}
				return Effect.sync(() => {
					console.error(`[ProtectedLayout] ${apiMePath} check failed`, err);
					next.set("signinError", SigninErrorToken.serverError);
				}).pipe(Effect.as(undefined));
			}),
			Effect.flatMap(() =>
				Effect.sync(() => {
					setSearchParams(next, { replace: true });
					void navigate(
						window.location.pathname +
							(next.toString() ? `?${next.toString()}` : ""),
						{ replace: true },
					);
				}),
			),
		);

		// Local alias for the small shape we sometimes get from Effect.runFork.
		// Different runtimes return different shapes: a fiber with interrupt(),
		// a thenable that resolves to a fiber, or a plain Promise. Be defensive
		// and support all shapes to avoid calling a missing interrupt() method.
		type EffectFiberHandle = { interrupt?: () => Promise<unknown> };

		const runtimeFiber = Effect.runFork(fetchEffect) as unknown;

		// Synchronously capture the returned value; it may be a fiber handle
		// with interrupt(), or a thenable that resolves to such a handle.
		const maybeFiber = runtimeFiber as
			| EffectFiberHandle
			| Promise<unknown>
			| undefined;

		return () => {
			controller.abort();

			try {
				if (!maybeFiber) {
					return;
				}

				// If the returned value already exposes interrupt(), call it.
				// Avoid optional chaining inside try/catch (react-compiler issue)
				// and avoid the non-null assertion operator. Use a type guard so
				// TypeScript understands interrupt() is present.
				function hasInterrupt(
					fiberCandidate: EffectFiberHandle | Promise<unknown> | undefined,
				): fiberCandidate is EffectFiberHandle & {
					interrupt: () => Promise<unknown>;
				} {
					return (
						Boolean(fiberCandidate) &&
						typeof (fiberCandidate as Partial<EffectFiberHandle>).interrupt ===
							"function"
					);
				}

				if (hasInterrupt(maybeFiber)) {
					// maybeFiber is now narrowed to a shape with interrupt()
					void maybeFiber.interrupt();
					return;
				}

				// If it's thenable, wait for the resolved fiber and call its
				// interrupt() if present. Fire-and-forget; cleanup may be
				// synchronous but interrupt() returns a Promise.
				if (typeof (maybeFiber as Promise<unknown>).then === "function") {
					(maybeFiber as Promise<unknown>)
						.then((resolved: unknown) => {
							// Narrow resolved to a shape with optional interrupt()
							type ResolvedFiber = { interrupt?: () => Promise<unknown> };
							if (resolved !== null && typeof resolved === "object") {
								const maybeResolved = resolved as ResolvedFiber;
								if (typeof maybeResolved.interrupt === "function") {
									void maybeResolved.interrupt();
								}
							}
							return undefined;
						})
						.catch(() => {
							/* ignore errors during cleanup */
						});
				}
			} catch (err) {
				// Defensive: don't let cleanup throw during React unmount.
				// Log for visibility in dev only.
				console.error("[ProtectedLayout] error interrupting fiber", err);
			}
		};
	}, [justSignedIn, navigate, searchParamsString, setSearchParams]);

	const store = useAppStore();
	const isSignedIn = store((state) => state.isSignedIn);
	const { lang = defaultLanguage } = useParams();

	// Still initializing — render nothing (parent Suspense handles hydration)
	if (isSignedIn === undefined) {
		return <div />;
	}

	if (isSignedIn === false) {
		// Redirect to language-prefixed home (you can change target as needed)
		return <Navigate to={`/${lang}`} replace />;
	}

	// Signed in — render nested routes
	return <Outlet />;
}
