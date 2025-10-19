export const SIGNIN_PENDING_KEY = "songshare:signinPending";
export const SIGNIN_PENDING_COOKIE = "songshare_signin_pending";
export const HIDE_STYLE_ID = "songshare-signin-hide";

export function setSigninPending(): void {
	try {
		sessionStorage.setItem(SIGNIN_PENDING_KEY, "1");
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
	} catch {
		// ignore
	}
	try {
		document.cookie = `${SIGNIN_PENDING_COOKIE}=; path=/; max-age=0`;
	} catch {
		// ignore
	}
	removeHideStyle();
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
			el.remove();
		}
	} catch {
		// ignore
	}
}
