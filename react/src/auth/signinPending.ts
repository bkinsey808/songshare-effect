export const SIGNIN_PENDING_KEY = "songshare:signinPending";
export const SIGNIN_PENDING_COOKIE = "songshare_signin_pending";
export const HIDE_STYLE_ID = "songshare-signin-hide";

// Debug flag: enable by setting window.__SONGSHARE_DEBUG__ = true in the browser
// or by setting VITE_SONGSHARE_DEBUG=true at build time.
const songshareDebug = Boolean(
	(globalThis as unknown as Record<string, unknown>)["__SONGSHARE_DEBUG__"] ===
		true ||
		(import.meta as { env?: Record<string, string> }).env?.[
			"VITE_SONGSHARE_DEBUG"
		] === "true",
);

export function setSigninPending(): void {
	try {
		sessionStorage.setItem(SIGNIN_PENDING_KEY, "1");
		if (songshareDebug) {
			// log a precise timestamp and stack-ish marker
			// eslint-disable-next-line no-console
			console.log("[songshare-debug] setSigninPending", {
				t: performance.now(),
				iso: new Date().toISOString(),
			});
		}
	} catch {
		// ignore
	}
	try {
		document.cookie = `${SIGNIN_PENDING_COOKIE}=1; path=/`;
	} catch {
		// ignore
	}
}

export function clearSigninPending(): void {
	try {
		sessionStorage.removeItem(SIGNIN_PENDING_KEY);
		if (songshareDebug) {
			// eslint-disable-next-line no-console
			console.log("[songshare-debug] clearSigninPending", {
				t: performance.now(),
				iso: new Date().toISOString(),
			});
		}
	} catch {
		// ignore
	}
	try {
		document.cookie = `${SIGNIN_PENDING_COOKIE}=; path=/; max-age=0`;
	} catch {
		// ignore
	}
}

export function isSigninPending(): boolean {
	try {
		if (sessionStorage.getItem(SIGNIN_PENDING_KEY) === "1") {
			return true;
		}
	} catch {
		// ignore
	}
	try {
		return document.cookie.indexOf(`${SIGNIN_PENDING_COOKIE}=`) !== -1;
	} catch {
		return false;
	}
}

export function removeHideStyle(): void {
	try {
		const el = document.getElementById(HIDE_STYLE_ID);
		if (el) {
			if (songshareDebug) {
				// eslint-disable-next-line no-console
				console.log("[songshare-debug] removeHideStyle - removing element", {
					t: performance.now(),
					iso: new Date().toISOString(),
				});
			}
			el.remove();
		}
	} catch {
		// ignore
	}
}
