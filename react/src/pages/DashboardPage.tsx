import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import DismissibleAlert from "@/react/components/DismissibleAlert/DismissibleAlert";
import { getStoreApi, useAppStoreHydrated } from "@/react/zustand/useAppStore";
import { SupportedLanguage } from "@/shared/language/supportedLanguages";
import { dashboardPath, deleteAccountPath } from "@/shared/paths";
import { justSignedInQueryParam } from "@/shared/queryParams";
import type { UserSessionData } from "@/shared/userSessionData";

function DashboardPage(): ReactElement {
	// Disable react-i18next suspense here to avoid suspending during render.
	const { t } = useTranslation(undefined, { useSuspense: false });
	const navigate = useNavigate();

	// Use hydration-aware app store hook to get hydration state only.
	const { isHydrated } = useAppStoreHydrated();

	// Local component state mirrors the store via a subscription so we
	// avoid calling the bound store selector hooks directly (which were
	// triggering hook-order issues). We initialize from the store snapshot
	// if available.
	const snapshot = getStoreApi()?.getState();
	const [localIsSignedIn, setLocalIsSignedIn] = useState<boolean | undefined>(
		() => snapshot?.isSignedIn,
	);
	const [localUser, setLocalUser] = useState<UserSessionData | undefined>(
		() => snapshot?.userSessionData,
	);
	const signOutRef = useRef<() => void>(() => snapshot?.signOut ?? (() => {}));
	const [showSignedInAlert, setShowSignedInAlert] = useState<boolean>(false);

	// showSignedInAlert comes directly from the zustand selector above.

	// (debug trace removed)
	// Derive current language from the path as a robust fallback
	const pathname =
		typeof window === "undefined" ? "/" : window.location.pathname;
	const maybeLang = pathname.split("/")[1] ?? "";
	const currentLang = maybeLang.length > 0 ? maybeLang : SupportedLanguage.en;

	// Check sessionStorage for the one-time justSignedIn signal set by the
	// redirect flow. If present, show the alert and consume the key.
	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}
		try {
			const item = sessionStorage.getItem(justSignedInQueryParam);
			if (item === "1") {
				console.warn(
					"[DashboardPage] consumed justSignedIn from sessionStorage",
				);
				// Schedule state update to avoid synchronous setState during
				// effect execution which some linters warn about.
				queueMicrotask(() => setShowSignedInAlert(true));
				sessionStorage.removeItem(justSignedInQueryParam);
			}
		} catch {
			// ignore storage access errors
		}
	}, []);

	// Subscribe to store updates to keep local state in sync.
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
	}, []);

	// If we haven't finished hydration, render a neutral placeholder to
	// ensure hook order remains stable and avoid hydration mismatches.
	if (!isHydrated) {
		return <div />;
	}

	if (localIsSignedIn === false) {
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
			{/* One-time success alert after signing in */}
			<DismissibleAlert
				visible={Boolean(showSignedInAlert)}
				onDismiss={() => setShowSignedInAlert(false)}
				variant="success"
			>
				{t(
					"pages.dashboard.signedInSuccess",
					"You have successfully signed in.",
				)}
			</DismissibleAlert>
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
							// Perform client-side sign-out immediately.
							signOutRef.current();
						} catch (err) {
							console.error("signOut failed:", err);
						}

						// Attempt sign-out on the server to clear the HttpOnly cookie.
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

						// Explicitly set client-side signed-out state after server call.
						try {
							const _storeApi = getStoreApi();
							if (_storeApi) {
								_storeApi.getState().setIsSignedIn(false);
							}
						} catch (err) {
							console.error("explicit setIsSignedIn(false) failed:", err);
						}

						// Soft navigate to localized root.
						void navigate(`/${currentLang}`, { replace: true });
					}}
				>
					{t("pages.dashboard.signOut")}
				</button>

				{/* Delete account navigates to a confirmation page */}
				<button
					className="ml-3 rounded border border-red-600 bg-transparent px-3 py-1 text-red-600 hover:bg-red-50/5"
					onClick={() =>
						navigate(`/${currentLang}/${dashboardPath}/${deleteAccountPath}`)
					}
				>
					{t("pages.dashboard.deleteAccount", "Delete Account")}
				</button>
			</div>
		</div>
	);
}

export default DashboardPage;
