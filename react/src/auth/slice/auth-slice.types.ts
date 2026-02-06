import type { UserSessionData } from "@/shared/userSessionData";

type AuthState = {
	isSignedIn: boolean | undefined;
	userSessionData: UserSessionData | undefined;
	/** One-time UI flag to show a success alert after sign-in redirect. */
	showSignedInAlert: boolean;
};

type AuthSlice = AuthState & {
	setIsSignedIn: (isSignedIn: boolean | undefined) => void;
	signIn: (userSessionData: UserSessionData) => void;
	signOut: () => void;
	setShowSignedInAlert: (value: boolean) => void;
};

export type { AuthSlice, AuthState };
