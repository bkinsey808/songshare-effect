export const ALERT_TYPES = {
	DELETE_SUCCESS: "deleteSuccess",
	SIGN_OUT_SUCCESS: "signOutSuccess",
	SIGNED_IN_SUCCESS: "signedInSuccess",
	REGISTERED_SUCCESS: "registeredSuccess",
	UNAUTHORIZED_ACCESS: "unauthorizedAccess",
} as const;

export type AlertType = (typeof ALERT_TYPES)[keyof typeof ALERT_TYPES];

export const {
	DELETE_SUCCESS,
	SIGN_OUT_SUCCESS,
	SIGNED_IN_SUCCESS,
	REGISTERED_SUCCESS,
	UNAUTHORIZED_ACCESS,
} = ALERT_TYPES;

export const ALL_ALERT_TYPES = Object.values(ALERT_TYPES) as AlertType[];
