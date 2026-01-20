import { cacheUserToken } from "@/react/supabase/tokenCache";
import { sliceResetFns } from "@/react/zustand/slice-reset-fns";
import { type Api, type Get, type Set } from "@/react/zustand/slice-utils";
import { apiUserTokenPath } from "@/shared/paths";
import { type UserSessionData } from "@/shared/userSessionData";

type AuthState = {
	isSignedIn: boolean | undefined;
	userSessionData: UserSessionData | undefined;
	// One-time UI flag to show a success alert after sign-in redirect.
	showSignedInAlert: boolean;
};

type AuthSlice = AuthState & {
	setIsSignedIn: (isSignedIn: boolean | undefined) => void;
	signIn: (userSessionData: UserSessionData) => void;
	signOut: () => void;
	setShowSignedInAlert: (value: boolean) => void;
};

const initialState: AuthState = {
	isSignedIn: undefined,
	userSessionData: undefined as UserSessionData | undefined,
	showSignedInAlert: false,
};

// Arrow-style factory is the preferred pattern for these slice creators.
// Suppress the `func-style` rule here.
export function createAuthSlice(
	set: Set<AuthSlice>,
	get: Get<AuthSlice>,
	api: Api<AuthSlice>,
): AuthSlice {
	// Silence unused param warnings for slices that don't need get/api
	void get;
	void api;
	sliceResetFns.add(() => {
		set(initialState);
	});

	return {
		...initialState,
		setIsSignedIn: (isSignedIn: boolean | undefined) => {
			if (typeof globalThis !== "undefined") {
				console.warn("[authSlice] setIsSignedIn called with:", isSignedIn);
			}
			set({ isSignedIn });
		},
		signIn: (userSessionData: UserSessionData) => {
			set({
				isSignedIn: true,
				userSessionData,
			});

			console.warn("[authSlice] signIn called, starting token fetch...");

			// Fetch and cache the Supabase user token for database access
			void (async (): Promise<void> => {
				try {
					console.warn("[authSlice] Fetching user token from:", apiUserTokenPath);
					const response = await fetch(apiUserTokenPath as string, {
						method: "GET",
						credentials: "include",
						headers: { Accept: "application/json" },
					});

					console.warn("[authSlice] Token fetch response status:", response.status);

					if (!response.ok) {
						console.warn("[authSlice] Failed to fetch user token:", response.status);
						return;
					}

					const data: unknown = await response.json();
					console.warn("[authSlice] Token fetch response data:", data);

					// Unwrap the response envelope {success: true, data: {...}}
					let tokenData: unknown = data;
					if (
						typeof data === "object" &&
						data !== null &&
						"success" in data &&
						data.success === true &&
						"data" in data
					) {
						tokenData = data.data;
					}

					if (
						typeof tokenData === "object" &&
						tokenData !== null &&
						"access_token" in tokenData &&
						typeof tokenData.access_token === "string" &&
						"expires_in" in tokenData &&
						typeof tokenData.expires_in === "number"
					) {
						const MS_IN_SECOND = 1000;
						const expiryTime = Date.now() + tokenData.expires_in * MS_IN_SECOND;
						cacheUserToken(tokenData.access_token, expiryTime);
						console.warn(
							"[authSlice] User token cached successfully, expires at:",
							new Date(expiryTime),
						);
					} else {
						console.warn("[authSlice] Invalid token response format:", tokenData);
					}
				} catch (error) {
					console.error("[authSlice] Error fetching user token:", error);
				}
			})();
		},
		signOut: () => {
			set({
				isSignedIn: false,
				userSessionData: undefined,
			});
		},
		setShowSignedInAlert: (value: boolean) => {
			if (typeof globalThis !== "undefined") {
				console.warn("[authSlice] setShowSignedInAlert:", value);
			}
			set({ showSignedInAlert: value });
		},
	};
}

export type { AuthSlice };
