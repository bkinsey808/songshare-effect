#!/usr/bin/env bun
/**
 * Copies the production Supabase DB (schema + migration history) to the
 * staging project so it starts from the same baseline as production.
 *
 * Run via: npm run supabase:copy-to-staging
 *
 * What it does:
 *  1. Uses pg_dump to export the `public` and `supabase_migrations` schemas
 *     from production (so future `db push` to staging knows which migrations
 *     are already applied).
 *  2. Links the Supabase CLI to staging to auto-discover its pooler URL.
 *  3. Restores the dump into staging with psql.
 *  4. Re-links the CLI back to production.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

import loadEnvVariables from "@/scripts/build/generate-effect-schemas/helpers/loadEnvVariables";
import { error as sError, warn as sWarn } from "@/scripts/utils/scriptLogger";

const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;

const projectRoot = process.cwd();
const envPath = join(projectRoot, ".env");
const dumpPath = join(projectRoot, "tmp", "prod-dump.sql");
const poolerUrlPath = join(projectRoot, "supabase", ".temp", "pooler-url");
const supabaseBin = join(projectRoot, "node_modules", ".bin", "supabase");

// ── helpers ──────────────────────────────────────────────────────────────────

function run(cmd: string, env: NodeJS.ProcessEnv): void {
	const result = spawnSync(cmd, { shell: true, stdio: "inherit", env });
	if (result.status !== EXIT_SUCCESS) {
		sError(`\n❌ Command failed: ${cmd}`);
		process.exit(result.status ?? EXIT_FAILURE);
	}
}

function runBin(bin: string, args: string[], env: NodeJS.ProcessEnv): void {
	const result = spawnSync(bin, args, { stdio: "inherit", env });
	if (result.status !== EXIT_SUCCESS) {
		sError(`\n❌ Command failed: ${bin} ${args.join(" ")}`);
		process.exit(result.status ?? EXIT_FAILURE);
	}
}

// ── load config ──────────────────────────────────────────────────────────────

const envVars = loadEnvVariables(envPath);
const mergedEnv = { ...process.env, ...envVars } as NodeJS.ProcessEnv;

const stagingRef = envVars["SUPABASE_STAGING_PROJECT_REF"];
const stagingPw = envVars["SUPABASE_STAGING_PW"];
const prodRef = envVars["SUPABASE_PROJECT_REF"];
const prodPgHost = envVars["PGHOST"];
const prodPgPort = envVars["PGPORT"] ?? "6543";
const prodPgUser = envVars["PGUSER"];
const prodPgPassword = envVars["PGPASSWORD"];
const prodPgDatabase = envVars["PGDATABASE"] ?? "postgres";

if (stagingRef === undefined || stagingRef === "" || stagingPw === undefined || stagingPw === "") {
	sError("❌ SUPABASE_STAGING_PROJECT_REF or SUPABASE_STAGING_PW not set in .env");
	process.exit(EXIT_FAILURE);
}
if (
	prodRef === undefined ||
	prodRef === "" ||
	prodPgHost === undefined ||
	prodPgHost === "" ||
	prodPgUser === undefined ||
	prodPgUser === "" ||
	prodPgPassword === undefined ||
	prodPgPassword === ""
) {
	sError(
		"❌ Production DB env vars (PGHOST, PGUSER, PGPASSWORD, SUPABASE_PROJECT_REF) not set in .env",
	);
	process.exit(EXIT_FAILURE);
}

// ── step 1: dump production ───────────────────────────────────────────────────

sWarn("📦 Dumping production DB (public + supabase_migrations schemas)...");

const dumpEnv = { ...mergedEnv, PGPASSWORD: prodPgPassword };
const pgDumpCmd = [
	"pg_dump",
	`-h "${prodPgHost}"`,
	`-p ${prodPgPort}`,
	`-U "${prodPgUser}"`,
	`-d "${prodPgDatabase}"`,
	"--schema=public",
	"--schema=supabase_migrations",
	"--no-owner",
	"--no-privileges",
	"--clean",
	"--if-exists",
	`-f "${dumpPath}"`,
].join(" ");
run(pgDumpCmd, dumpEnv);

sWarn(`✅ Dump saved to ${dumpPath}`);

// ── step 2: link CLI to staging to discover pooler URL ───────────────────────

sWarn(`\n🔗 Linking Supabase CLI to staging project (${stagingRef})...`);
runBin(supabaseBin, ["link", "--project-ref", stagingRef, "--password", stagingPw], mergedEnv);

if (!existsSync(poolerUrlPath)) {
	sError("❌ Could not read pooler URL after linking to staging.");
	process.exit(EXIT_FAILURE);
}

// pooler-url contains: postgresql://postgres.PROJECT_REF@HOST:PORT/postgres
// Inject the password so psql can connect directly.
const rawPoolerUrl = readFileSync(poolerUrlPath, "utf8").trim();
const stagingUrl = rawPoolerUrl.replace(
	`://postgres.${stagingRef}@`,
	`://postgres.${stagingRef}:${stagingPw}@`,
);

// ── step 3: restore dump into staging ────────────────────────────────────────

sWarn("\n🔄 Restoring dump into staging DB...");
run(`psql "${stagingUrl}" -f "${dumpPath}"`, mergedEnv);
sWarn("✅ Staging DB is now in sync with production schema.");

// ── step 4: re-link CLI back to production ────────────────────────────────────

sWarn(`\n🔗 Re-linking Supabase CLI to production project (${prodRef})...`);
runBin(supabaseBin, ["link", "--project-ref", prodRef, "--password", prodPgPassword], mergedEnv);

// ── cleanup ──────────────────────────────────────────────────────────────────

unlinkSync(dumpPath);
sWarn("\n✅ Done! Staging DB matches production. You can now run:");
sWarn("   npm run supabase:migrate:staging   (for future migrations)");
