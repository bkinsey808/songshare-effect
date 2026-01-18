// Lightweight ambient types for the Cookie Store API (used only where
// supported by the browser). These narrow declarations allow safe, typed
// usage without leaking `any` into the codebase.

declare namespace CookieStoreAPI {
	export type CookieStoreSetOptions = {
		name: string;
		value: string;
		expires?: Date | number;
		path?: string;
		sameSite?: "lax" | "none" | "strict";
		secure?: boolean;
	};

	export type CookieStore = {
		set(options: CookieStoreSetOptions): Promise<void>;
	};
}

declare const cookieStore: CookieStoreAPI.CookieStore | undefined;
export type __CookieStoreMarker = never;
