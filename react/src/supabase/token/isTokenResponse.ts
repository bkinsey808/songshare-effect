import isRecord from "@/shared/type-guards/isRecord";

export type TokenResponse = {
	access_token: string;
	token_type: string;
	expires_in: number;
};

export function isTokenResponse(value: unknown): value is TokenResponse {
	if (!isRecord(value)) {
		return false;
	}
	const rec = value;
	return (
		Object.hasOwn(rec, "access_token") &&
		Object.hasOwn(rec, "token_type") &&
		Object.hasOwn(rec, "expires_in") &&
		typeof rec["access_token"] === "string" &&
		typeof rec["token_type"] === "string" &&
		typeof rec["expires_in"] === "number"
	);
}
