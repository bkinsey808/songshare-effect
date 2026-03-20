#!/usr/bin/env bun
/* oxlint-disable no-console */
/**
 * Generates a Playwright storageState file (`e2e/.auth/google-user.json`)
 * that contains a pre-signed `userSession` cookie for the Google test account.
 *
 * How it works:
 *  1. Uses the Supabase Admin API to fetch the user's row from `user` and
 *     `user_public` tables by email.
 *  2. Constructs a `UserSessionData` JWT payload (same shape the OAuth callback
 *     builds after Google login).
 *  3. Signs the JWT with `SUPABASE_JWT_SECRET` using HMAC-SHA256 (identical to the API).
 *  4. Writes `e2e/.auth/google-user.json` in Playwright storageState format.
 *
 * Run once before tests (valid for 7 days):
 *   bun e2e/utils/create-google-user-session.bun.ts           # local dev (.env)
 *   npm run e2e:create-session:staging-db                      # local servers + staging DB
 *   npm run e2e:create-session:staging-url                     # against staging URL (from keyring)
 *
 * Then in your spec:
 *   test.use({ storageState: "e2e/.auth/google-user.json" });
 *
 * Environment variables (read from .env automatically by Bun, or pass --env-file):
 *   VITE_SUPABASE_URL      — Supabase project URL (local or staging)
 *   SUPABASE_SERVICE_KEY   — Supabase service-role key (admin access)
 *   SUPABASE_JWT_SECRET             — Secret used to sign/verify userSession JWTs
 *   E2E_GOOGLE_USER_EMAIL  — Email of the Google test account (required — no default)
 *   PLAYWRIGHT_BASE_URL    — Target URL for tests (affects cookie domain and IP detection)
 *   E2E_CLIENT_IP          — Override the IP embedded in the JWT (auto-detected if unset)
 *
 * IP behaviour:
 *   - localhost / 127.0.0.1 target  →  JWT ip = "127.0.0.1"
 *   - Remote target (e.g. staging domain)  →  public outbound IP auto-detected
 *     via https://api.ipify.org, or set E2E_CLIENT_IP to skip the network call.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { createClient } from "@supabase/supabase-js";
import { sign } from "hono/jwt";

// ── constants ─────────────────────────────────────────────────────────────────

const EXIT_FAILURE = 1;
const FIRST = 0;
const LIMIT_ONE = 1;
const EMPTY_LENGTH = 0;
const SEVEN_DAYS_SECONDS = 604_800;
const MS_PER_SECOND = 1000;
const JSON_INDENT = 2;

// ── env ──────────────────────────────────────────────────────────────────────

const supabaseUrl = process.env["VITE_SUPABASE_URL"];
const serviceKey = process.env["SUPABASE_SERVICE_KEY"];
const jwtSecret = process.env["SUPABASE_JWT_SECRET"];
const testEmail = process.env["E2E_GOOGLE_USER_EMAIL"];

if (supabaseUrl === undefined || supabaseUrl === "") {
	console.error("❌  Missing required env var: VITE_SUPABASE_URL");
	console.error("    Make sure .env is present or this var is set in the environment.");
	process.exit(EXIT_FAILURE);
}
if (serviceKey === undefined || serviceKey === "") {
	console.error("❌  Missing required env var: SUPABASE_SERVICE_KEY");
	process.exit(EXIT_FAILURE);
}
if (jwtSecret === undefined || jwtSecret === "") {
	console.error("❌  Missing required env var: SUPABASE_JWT_SECRET");
	process.exit(EXIT_FAILURE);
}
if (testEmail === undefined || testEmail === "") {
	console.error("❌  Missing required env var: E2E_GOOGLE_USER_EMAIL");
	process.exit(EXIT_FAILURE);
}

// ── detect client IP ─────────────────────────────────────────────────────────

const baseUrl = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://127.0.0.1:5173";
const parsedBase = new URL(baseUrl);
const isLocalTarget = parsedBase.hostname === "127.0.0.1" || parsedBase.hostname === "localhost";

async function detectPublicIp(): Promise<string> {
	const response = await fetch("https://api.ipify.org?format=text");
	const ip = await response.text();
	return ip.trim();
}

const ipOverride = process.env["E2E_CLIENT_IP"];

async function resolveClientIp(): Promise<string> {
	if (ipOverride !== undefined && ipOverride !== "") {
		console.log(`ℹ️   Using E2E_CLIENT_IP override: ${ipOverride}`);
		return ipOverride;
	}
	if (isLocalTarget) {
		return "127.0.0.1";
	}
	console.log("🌐  Detecting public outbound IP (for remote Cloudflare target)...");
	const ip = await detectPublicIp().catch((error: unknown) => {
		console.error(
			"❌  Failed to detect public IP:",
			error instanceof Error ? error.message : String(error),
		);
		console.error("    Set E2E_CLIENT_IP=<your-ip> to bypass auto-detection.");
		process.exit(EXIT_FAILURE);
	});
	console.log(`✅  Detected IP: ${ip}`);
	return ip;
}

const clientIp = await resolveClientIp();

// ── fetch user data ───────────────────────────────────────────────────────────

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
	auth: { persistSession: false },
});

console.log(`🔍  Looking up user: ${testEmail}`);

const { data: userRows, error: userError } = await supabaseAdmin
	.from("user")
	.select("*")
	.eq("email", testEmail)
	.limit(LIMIT_ONE);

if (userError !== null || userRows === null || userRows.length === EMPTY_LENGTH) {
	const msg = userError === null ? "no rows returned" : userError.message;
	console.error("❌  Could not fetch user row:", msg);
	console.error("    Make sure the account has signed in at least once and the email matches.");
	process.exit(EXIT_FAILURE);
}

// Supabase returns `any[]` for untyped table queries; narrow to a useful shape.
function isStringRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

const rawUserRow: unknown = userRows[FIRST];
if (!isStringRecord(rawUserRow)) {
	console.error("❌  Unexpected user row shape");
	process.exit(EXIT_FAILURE);
}
const userRow = rawUserRow;

const userId = typeof userRow["user_id"] === "string" ? userRow["user_id"] : undefined;
if (userId === undefined) {
	console.error("❌  user row is missing user_id");
	process.exit(EXIT_FAILURE);
}

const userName = typeof userRow["name"] === "string" ? userRow["name"] : "";
console.log(`✅  Found user: ${userName} (${userId})`);

// Fetch username from user_public
const { data: publicRows, error: publicError } = await supabaseAdmin
	.from("user_public")
	.select("username")
	.eq("user_id", userId)
	.limit(LIMIT_ONE);

if (publicError !== null || publicRows === null || publicRows.length === EMPTY_LENGTH) {
	const msg = publicError === null ? "no rows returned" : publicError.message;
	console.error("❌  Could not fetch user_public row:", msg);
	process.exit(EXIT_FAILURE);
}

const rawPublicRow: unknown = publicRows[FIRST];
if (!isStringRecord(rawPublicRow)) {
	console.error("❌  Unexpected user_public row shape");
	process.exit(EXIT_FAILURE);
}
const username = typeof rawPublicRow["username"] === "string" ? rawPublicRow["username"] : userName;

// ── build JWT payload ─────────────────────────────────────────────────────────

const userSub = typeof userRow["sub"] === "string" ? userRow["sub"] : undefined;

// Strip null values so schema optional fields (string | undefined) don't fail
// validation — the DB returns null for absent columns but the Effect schema
// uses Schema.optional which accepts absent/undefined, not null.
const cleanUserRow = Object.fromEntries(Object.entries(userRow).filter(([, val]) => val !== null));

const sessionPayload: Record<string, unknown> = {
	user: cleanUserRow,
	userPublic: {
		user_id: userId,
		username,
	},
	oauthUserData: {
		email: testEmail,
		name: userName,
		...(userSub === undefined ? {} : { sub: userSub }),
	},
	oauthState: {
		csrf: "e2e-test-session",
		lang: "en",
		provider: "google",
	},
	ip: clientIp,
};

// ── sign JWT ──────────────────────────────────────────────────────────────────

console.log("🔐  Signing userSession JWT...");

// hono/jwt `sign` uses HMAC-SHA256 by default — same as the API
const jwtResult = await sign(sessionPayload, jwtSecret).catch((error: unknown) => {
	console.error("❌  Failed to sign JWT:", error instanceof Error ? error.message : String(error));
	process.exit(EXIT_FAILURE);
});

// ── write storageState ────────────────────────────────────────────────────────

const expiresAt = Math.floor(Date.now() / MS_PER_SECOND) + SEVEN_DAYS_SECONDS;

const cookieDomain = parsedBase.hostname;
const isSecure = parsedBase.protocol === "https:";

const storageState = {
	cookies: [
		{
			name: "userSession",
			value: jwtResult,
			domain: cookieDomain,
			path: "/",
			expires: expiresAt,
			httpOnly: true,
			secure: isSecure,
			sameSite: "Lax" as const,
		},
	],
	origins: [] as unknown[],
};

const sessionOutputRelative = process.env["E2E_SESSION_OUTPUT"] ?? "e2e/.auth/google-user.json";
const outputPath = join(process.cwd(), sessionOutputRelative);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(storageState, undefined, JSON_INDENT));

const expiresDisplay = new Date(expiresAt * MS_PER_SECOND).toISOString();
console.log(`✅  Session saved to: ${sessionOutputRelative}`);
console.log(`    Domain: ${cookieDomain}  |  Expires: ${expiresDisplay}`);
console.log("");
console.log("    Use in your spec:");
console.log(`    test.use({ storageState: "${sessionOutputRelative}" });`);
