import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { getStoreApi, useAppStoreHydrated } from "@/react/zustand/useAppStore";
import { SupportedLanguage } from "@/shared/language/supportedLanguages";
import type { UserSessionData } from "@/shared/userSessionData";

// Use react-router's navigate for sign-out to avoid browser-specific hard navigation issues.

function DashboardPage(): ReactElement {
	// Disable react-i18next suspense here to avoid suspending during render.
	// If useTranslation were to throw a promise (suspense) it could
	// interrupt hook ordering and lead to "rendered fewer hooks than
	// expected" errors in some browsers/environments. We disable
	// suspense here to keep hook order stable.
	const { t } = useTranslation(undefined, { useSuspense: false });
	const navigate = useNavigate();

	// useAppStore() returns a bound store function. Call it to obtain the
	// selector-style hook to avoid calling hooks indirectly or from event
	// handlers. This keeps hook call order stable and avoids invalid hook
	// call errors.
	// Use the hydration-aware hook so we don't render a signed-out UI
	// before client-side store hydration completes. This avoids
	// server/client render mismatches that can cause "rendered fewer
	// hooks than expected" errors in privacy-sensitive browsers (e.g.
	// Brave) where cookies may be blocked or delayed.
	const { store, isHydrated } = useAppStoreHydrated();

	// Avoid direct store selectors during render to prevent useSyncExternalStore
	// getSnapshot warnings and potential hook-order jitter. Read the store via
	// getStoreApi() in an effect and mirror the values into local state.
	// Initialize local values synchronously from the store API if available.
	const _api = getStoreApi();
	const _initialSnapshot = _api ? _api.getState() : undefined;

	const [localIsSignedIn, setLocalIsSignedIn] = useState<boolean | undefined>(
		() => _initialSnapshot?.isSignedIn,
	);
	const [localUser, setLocalUser] = useState<UserSessionData | undefined>(
		() => _initialSnapshot?.userSessionData,
	);
	const signOutRef = useRef<() => void>(() => {
		// Default no-op until the store subscription initializes.
		return _initialSnapshot?.signOut ?? (() => {});
	});

	useEffect(() => {
		const api = getStoreApi();
		if (!api) {
			return;
		}

		const unsubscribe = api.subscribe((state) => {
			setLocalIsSignedIn(state.isSignedIn);
			setLocalUser(state.userSessionData);
			signOutRef.current = state.signOut;
		});

		return () => unsubscribe();
	}, [store]);

	// Small debug trace for authentication/hydration sequence.
	// Remove or reduce in production.
	// eslint-disable-next-line no-console
	console.debug(
		"[DashboardPage] isHydrated=",
		isHydrated,
		"isSignedIn=",
		localIsSignedIn,
	);
	// Derive current language from the path as a robust fallback
	const pathname =
		typeof window === "undefined" ? "/" : window.location.pathname;
	const maybeLang = pathname.split("/")[1] ?? "";
	const currentLang = maybeLang.length > 0 ? maybeLang : SupportedLanguage.en;

	// If we haven't finished hydration, render a neutral placeholder to
	// ensure hook order remains stable and avoid hydration mismatches.
	if (!isHydrated) {
		// Debug: record early return due to hydration
		// eslint-disable-next-line no-console
		console.debug("[DashboardPage] early return: !isHydrated");
		return <div />;
	}

	if (localIsSignedIn === false) {
		// Debug: user not signed in — rendering signed-out UI
		// eslint-disable-next-line no-console
		console.debug("[DashboardPage] early return: localIsSignedIn === false");

		return (
			<div className="text-center text-gray-300">
				<h2 className="text-2xl font-bold">
					{t("pages.dashboard.signedOutTitle")}
				</h2>
				<p className="mt-2">{t("pages.dashboard.signedOutBody")}</p>
			</div>
		);
	}

	return (
		<div>
			<h2 className="mb-4 text-3xl font-bold">{t("pages.dashboard.title")}</h2>
			<p className="text-gray-300">
				{t("pages.dashboard.welcome", { name: localUser?.user?.name ?? "" })}
			</p>
			<div className="mt-4">
				<button
					className="rounded bg-red-600 px-3 py-1 text-white"
					onClick={async () => {
						// Immediately clear client-side auth state so UI reflects
						// sign-out without waiting on network roundtrips. This
						// avoids the appearance of "nothing happened" when the
						// network is slow or the backend cookie take time to clear.
						try {
							// Debug: store state immediately before client-side signOut
							// Read store API into a local variable to avoid complex
							// expressions inside console.debug (some transforms
							// currently fail on value blocks inside try/catch).
							const _storeApiBefore = getStoreApi();
							let _signedBefore: boolean | undefined;
							if (_storeApiBefore) {
								_signedBefore = _storeApiBefore.getState().isSignedIn;
							} else {
								_signedBefore = undefined;
							}
							// eslint-disable-next-line no-console
							console.debug(
								"[DashboardPage] before signOut, store.isSignedIn=",
								_signedBefore,
							);

							signOutRef.current();

							// Debug: store state immediately after client-side signOut
							const _storeApiAfter = getStoreApi();
							let _signedAfter: boolean | undefined;
							if (_storeApiAfter) {
								_signedAfter = _storeApiAfter.getState().isSignedIn;
							} else {
								_signedAfter = undefined;
							}
							// eslint-disable-next-line no-console
							console.debug(
								"[DashboardPage] after signOut, store.isSignedIn=",
								_signedAfter,
							);
						} catch (err) {
							console.error("signOutRef failed:", err);
						}

						// Attempt sign-out on the server to clear the HttpOnly cookie.
						// Log response status for debugging. We do not rely on this
						// for updating client state — that is already cleared.
						try {
							const res = await fetch(`/api/auth/signout`, {
								method: "POST",
								credentials: "include",
							});
							// eslint-disable-next-line no-console
							console.debug("/api/auth/signout status=", res.status);
						} catch (err) {
							console.error("Sign-out API failed:", err);
						}

						// As a defensive measure, explicitly set client-side signed
						// out state after the server call. This helps when in-flight
						// /api/me requests or other timing issues might leave the
						// UI stale.
						try {
							const _storeApi = getStoreApi();
							if (_storeApi) {
								_storeApi.getState().setIsSignedIn(false);
							}
						} catch (err) {
							console.error("explicit setIsSignedIn(false) failed:", err);
						}

						// Use soft navigation to the localized root instead of hard navigation
						// to avoid browser-specific reload issues.
						void navigate(`/${currentLang}`, { replace: true });
					}}
				>
					{t("pages.dashboard.signOut")}
				</button>
			</div>
		</div>
	);
}

export default DashboardPage;
