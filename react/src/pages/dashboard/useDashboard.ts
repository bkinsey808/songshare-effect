import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { UserSessionData } from "@/shared/userSessionData";

import getCurrentLangFromPath from "@/react/language/path/getCurrentLangFromPath";
import { clientDebug, clientError, clientWarn } from "@/react/utils/clientLogger";
import { getStoreApi } from "@/react/zustand/useAppStore";
import { SIGNAL_ONE } from "@/shared/constants/http";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { apiAuthSignOutPath } from "@/shared/paths";
import { justSignedInQueryParam } from "@/shared/queryParams";
import {
	justRegisteredKey,
	justSignedOutKey,
	justUnauthorizedAccessKey,
} from "@/shared/sessionStorageKeys";

/**
 * Public shape returned by the hook.
 */
export type UseDashboardState = {
	localIsSignedIn: boolean | undefined;
	localUser: UserSessionData | undefined;
	signOutRef: React.RefObject<() => void>;
	/**
	 * Performs the complete sign-out flow (client + server + UI navigation).
	 * Returned here so the component can call a single, well-tested method.
	 */
	signOut: () => Promise<void>;
	showSignedInAlert: boolean;
	showRegisteredAlert: boolean;
	showUnauthorizedAlert: boolean;
	setShowSignedInAlert: (value: boolean) => void;
	setShowRegisteredAlert: (value: boolean) => void;
	setShowUnauthorizedAlert: (value: boolean) => void;
	currentLang: string;
};

/**
 * Encapsulates Dashboard page local state and store subscriptions.
 *
 * - Mirrors selected parts of the global store into local component state
 *   (avoids hook-order issues when selectors are used directly in the tree).
 * - Consumes one-time sessionStorage signals used by the redirect sign-in
 *   / registration flows and exposes alert flags.
 * - Derives the current language from the pathname as a robust fallback.
 *
 * This is a thin, testable extraction of the logic previously colocated in
 * `DashboardPage`.
 *
 * @returns The local dashboard state and helpers.
 */
export default function useDashboard(): UseDashboardState {
	const snapshot = getStoreApi().getState();

	const [localIsSignedIn, setLocalIsSignedIn] = useState<boolean | undefined>(
		() => snapshot.isSignedIn,
	);
	const [localUser, setLocalUser] = useState<UserSessionData | undefined>(
		() => snapshot.userSessionData,
	);
	const signOutRef = useRef<() => void>(() => snapshot.signOut);
	const [showSignedInAlert, setShowSignedInAlert] = useState<boolean>(false);
	const [showRegisteredAlert, setShowRegisteredAlert] = useState<boolean>(false);
	const [showUnauthorizedAlert, setShowUnauthorizedAlert] = useState<boolean>(false);

	// Derive current language from the URL. Use the *strict* parser here to
	// normalize to a supported language (fallback to `en`) instead of
	// preserving arbitrary/legacy path segments.
	const currentLang = getCurrentLangFromPath(
		typeof globalThis === "undefined" ? "/" : globalThis.location.pathname,
	);
	useEffect(() => {
		if (typeof globalThis === "undefined") {
			return;
		}

		try {
			const justRegistered = sessionStorage.getItem(justRegisteredKey);
			const justSigned = sessionStorage.getItem(justSignedInQueryParam);
			const justUnauthorized = sessionStorage.getItem(justUnauthorizedAccessKey);
			if (justRegistered === SIGNAL_ONE) {
				clientWarn("[DashboardPage] consumed justRegistered from sessionStorage");
				queueMicrotask(() => {
					setShowRegisteredAlert(true);
				});
				sessionStorage.removeItem(justRegisteredKey);
			} else if (justSigned === SIGNAL_ONE) {
				clientWarn("[DashboardPage] consumed justSignedIn from sessionStorage");
				queueMicrotask(() => {
					setShowSignedInAlert(true);
				});
				sessionStorage.removeItem(justSignedInQueryParam);
			} else if (justUnauthorized === SIGNAL_ONE) {
				clientWarn("[DashboardPage] consumed justUnauthorizedAccess from sessionStorage");
				queueMicrotask(() => {
					setShowUnauthorizedAlert(true);
				});
				sessionStorage.removeItem(justUnauthorizedAccessKey);
			}
		} catch {
			// ignore storage access errors
		}
	}, []);

	useEffect(() => {
		const api = getStoreApi();

		const unsubscribe = api.subscribe((state) => {
			setLocalIsSignedIn(state.isSignedIn);
			setLocalUser(state.userSessionData);
			signOutRef.current = state.signOut;
		});

		return (): void => {
			unsubscribe();
		};
	}, []);

	const navigate = useNavigate();

	// Local helper: attempt to invoke the current store's `signOut` safely and
	// indicate whether it was invoked. Kept local to the hook to avoid
	// perturbing module-level initialization and to satisfy lint rules.
	function tryCallStoreSignOutSafe(): boolean {
		try {
			const storeApi = getStoreApi();
			const fn = storeApi.getState().signOut;
			if (typeof fn === "function") {
				fn();
				return true;
			}
			return false;
		} catch {
			return false;
		}
	}

	/**
	 * Perform full sign-out flow:
	 * - immediately clear client-side auth state (best-effort)
	 * - call server signout endpoint to clear HttpOnly cookie
	 * - explicitly mark store as signed-out
	 * - set one-time sessionStorage signal consumed by the home page
	 * - soft-navigate to localized root
	 *
	 * @returns Resolves after side-effects have been initiated.
	 */
	async function signOut(): Promise<void> {
		// Immediately clear client-side auth state so UI reflects sign-out
		// without waiting on network roundtrips. Prefer the ref callback (fast),
		// but fall back to calling the current store implementation if the ref
		// wasn't updated yet (makes the operation robust in tests and edge-cases).
		const didCallStoreSignOut = tryCallStoreSignOutSafe();
		if (!didCallStoreSignOut) {
			try {
				signOutRef.current();
			} catch (error) {
				clientError("signOut failed:", error);
				// Best-effort fallback to the live store implementation
				tryCallStoreSignOutSafe();
			}
		}

		// Attempt sign-out on the server to clear the HttpOnly cookie.
		try {
			const res = await fetch(apiAuthSignOutPath, {
				method: "POST",
				credentials: "include",
			});
			clientDebug(`${apiAuthSignOutPath} status=`, res.status);
		} catch (error) {
			clientError("Sign-out API failed:", error);
		}
		try {
			getStoreApi().getState().setIsSignedIn(false);
		} catch (error) {
			clientError("explicit setIsSignedIn(false) failed:", error);
		}

		// Soft navigate to localized root. Use sessionStorage-only as a one-time
		// signal for the home page alert.
		try {
			sessionStorage.setItem(justSignedOutKey, SIGNAL_ONE);
		} catch {
			/* ignore storage errors */
		}

		{
			const langForNav = isSupportedLanguage(currentLang) ? currentLang : defaultLanguage;
			void navigate(buildPathWithLang("/", langForNav), { replace: true });
		}
	}

	return {
		localIsSignedIn,
		localUser,
		signOutRef,
		signOut,
		showSignedInAlert,
		showRegisteredAlert,
		showUnauthorizedAlert,
		setShowSignedInAlert,
		setShowRegisteredAlert,
		setShowUnauthorizedAlert,
		currentLang,
	};
}
