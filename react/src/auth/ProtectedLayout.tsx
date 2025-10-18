import { Effect } from "effect";
import React, { useEffect } from "react";
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
export default function ProtectedLayout(): React.ReactElement {
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

		const fetchEffect = Effect.tryPromise<Response, unknown>({
			try: () =>
				fetch(apiMePath, { credentials: "include", signal: controller.signal }),
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
			Effect.catchAll((err) =>
				Effect.sync(() => {
					console.error(`[ProtectedLayout] ${apiMePath} check failed`, err);
					next.set("signinError", SigninErrorToken.serverError);
				}).pipe(Effect.as(undefined)),
			),
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

		// Local alias for the small shape we expect from Effect.runFork so we
		// avoid an anonymous `as unknown as` cast.
		type EffectFiberHandle = { interrupt: () => Promise<unknown> };

		const fiber = Effect.runFork(fetchEffect) as unknown as EffectFiberHandle;

		return () => {
			controller.abort();
			void fiber.interrupt();
		};
	}, [justSignedIn, navigate, searchParamsString, setSearchParams]);

	const store = useAppStore();
	const isSignedIn = store((state) => state.isSignedIn);
	const { lang = defaultLanguage } = useParams();

	// Still initializing — render nothing (parent Suspense handles hydration)
	if (isSignedIn === undefined) {
		return <div />;
	}

	if (!isSignedIn) {
		// Redirect to language-prefixed home (you can change target as needed)
		return <Navigate to={`/${lang}`} replace />;
	}

	// Signed in — render nested routes
	return <Outlet />;
}
