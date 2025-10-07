/* eslint-disable sonarjs/no-commented-code */
// import type { StateCreator } from "zustand";

// import { type SessionData } from "./sessionData";
// import { sliceResetFns } from "@/react/zustand/useAppStore";

// export type AuthSlice = {
// 	isSignedIn: boolean;
// 	sessionData: SessionData | undefined;
// 	sessionChecked: boolean;
// 	setSessionChecked: (checked: boolean) => void;
// 	signIn: (sessionData: SessionData, userToken: string | undefined) => void;
// 	signOut: () => void;
// };

// const initialState = {
// 	isSignedIn: false,
// 	sessionData: undefined as SessionData | undefined,
// 	sessionChecked: false,
// };

// export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (
// 	set,
// ) => {
// 	sliceResetFns.add(() => {
// 		set(initialState);
// 	});

// 	return {
// 		...initialState,
// 		setSessionChecked: (checked: boolean) => {
// 			if (typeof window !== "undefined") {
// 				console.warn("[zustand slice] setSessionChecked called with:", checked);
// 			}
// 			set({ sessionChecked: checked });
// 		},
// 		signIn: (sessionData: SessionData) => {
// 			set({ isSignedIn: true, sessionData, sessionChecked: true });
// 		},
// 		signOut: () => {
// 			set({ isSignedIn: false, sessionData: undefined, sessionChecked: true });
// 		},
// 	};
// };
