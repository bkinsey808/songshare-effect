// Thin wrapper that re-exports the shared oauth user data type and schema so
// api code can import using a local path (the dist build used to contain this
// file). This keeps source imports consistent with compiled artifacts.
import { Schema } from "effect";

import {
	type OauthUserData,
	OauthUserDataSchema,
} from "@/shared/oauth/oauthUserData";

export type { OauthUserData } from "@/shared/oauth/oauthUserData";

type FetchOpts = {
	accessTokenUrl: string;
	redirectUri: string;
	code: string;
	clientId?: string | undefined;
	clientSecret?: string | undefined;
	userInfoUrl: string;
};

async function exchangeCodeForToken(opts: FetchOpts): Promise<{
	accessToken: string | undefined;
	idToken: string | undefined;
	raw: unknown;
}> {
	const body = new URLSearchParams();
	body.set("grant_type", "authorization_code");
	body.set("code", opts.code);
	body.set("redirect_uri", opts.redirectUri);
	if (opts.clientId !== undefined) {
		body.set("client_id", opts.clientId);
	}
	if (opts.clientSecret !== undefined) {
		body.set("client_secret", opts.clientSecret);
	}

	const headers = new Headers();
	headers.set("Content-Type", "application/x-www-form-urlencoded");
	headers.set("Accept", "application/json");

	const res = await fetch(opts.accessTokenUrl, {
		method: "POST",
		headers,
		body: body.toString(),
	});

	if (!res.ok) {
		const text = await res.text().catch(() => "<non-text response>");
		// Surface provider response to server logs to diagnose invalid_grant reasons
		console.error(
			"[oauthUserData] Token exchange non-OK response:",
			res.status,
			text,
		);
		throw new Error(`Token exchange failed: ${res.status} ${text}`);
	}

	const jsonRaw = (await res.json().catch(() => undefined)) as unknown;
	if (jsonRaw === undefined) {
		throw new Error("Token exchange returned invalid JSON");
	}

	const asRecord =
		typeof jsonRaw === "object" && jsonRaw !== null
			? (jsonRaw as Record<string, unknown>)
			: {};
	const accessToken =
		typeof asRecord["access_token"] === "string"
			? String(asRecord["access_token"])
			: undefined;
	const idToken =
		typeof asRecord["id_token"] === "string"
			? String(asRecord["id_token"])
			: undefined;
	return { accessToken, idToken, raw: jsonRaw };
}

async function fetchUserInfo(
	userInfoUrl: string,
	accessToken?: string,
	idToken?: string,
): Promise<unknown> {
	const headers = new Headers();
	headers.set("Accept", "application/json");
	if (accessToken !== undefined) {
		headers.set("Authorization", `Bearer ${accessToken}`);
	} else if (idToken !== undefined) {
		headers.set("Authorization", `Bearer ${idToken}`);
	}

	const res = await fetch(userInfoUrl, { headers });
	if (!res.ok) {
		const t = await res.text().catch(() => "<non-text response>");
		console.error(
			"[oauthUserData] Userinfo fetch non-OK response:",
			res.status,
			t,
		);
		throw new Error(`Userinfo fetch failed: ${res.status} ${t}`);
	}

	const jsonRaw = (await res.json().catch(() => undefined)) as unknown;
	if (jsonRaw === undefined) {
		throw new Error("Userinfo returned invalid JSON");
	}
	return jsonRaw;
}

export async function fetchAndParseOauthUserData(
	opts: FetchOpts,
): Promise<OauthUserData> {
	const { accessToken, idToken } = await exchangeCodeForToken(opts);

	const infoRaw = await fetchUserInfo(opts.userInfoUrl, accessToken, idToken);
	const infoObj =
		typeof infoRaw === "object" && infoRaw !== null
			? (infoRaw as Record<string, unknown>)
			: {};

	const pickString = (
		obj: Record<string, unknown>,
		key: string,
	): string | undefined => {
		if (typeof key !== "string" || !/^\w+$/.test(key)) {
			return undefined;
		}
		// eslint-disable-next-line security/detect-object-injection -- key validated above
		const val = obj[key];
		if (typeof val === "string") {
			return String(val);
		}
		return undefined;
	};

	const candidate: Partial<OauthUserData> = {
		email:
			pickString(infoObj, "email") ??
			pickString(infoObj, "email_address") ??
			"",
		name:
			pickString(infoObj, "name") ??
			pickString(infoObj, "preferred_username") ??
			undefined,
		sub: pickString(infoObj, "sub") ?? undefined,
		id:
			pickString(infoObj, "id") ?? pickString(infoObj, "user_id") ?? undefined,
	};

	const validated = Schema.decodeUnknownSync(OauthUserDataSchema)(
		candidate as unknown,
	);
	return validated;
}
