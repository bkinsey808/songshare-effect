#!/usr/bin/env bun
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { safeGet } from "@/shared/utils/safe";

import { error as sError, warn as sWarn } from "./utils/scriptLogger";

const EXIT_NON_ZERO = 1;

/**
 * Gets an environment variable value safely, returning undefined if not found.
 * @param envVar - The environment variable name
 * @returns The environment variable value as a string, or undefined if not found/empty
 */
function getEnvValueSafe(envVar: string): string | undefined {
	const value = safeGet(process.env, envVar);
	return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/**
 * Keep-alive script to prevent Supabase project from pausing
 * This script makes a simple API call to keep the project active
 */
async function keepAlive(): Promise<void> {
	try {
		const supabaseUrl = getEnvValueSafe("VITE_SUPABASE_URL");
		const supabaseKey = getEnvValueSafe("VITE_SUPABASE_ANON_KEY");

		if (
			supabaseUrl?.trim() === "" ||
			supabaseUrl === undefined ||
			supabaseKey?.trim() === "" ||
			supabaseKey === undefined
		) {
			sError("❌ Missing Supabase credentials in environment");
			process.exit(EXIT_NON_ZERO);
		}

		sWarn("🏓 Pinging Supabase to keep project active...");

		// Simple REST API health check
		const response = await fetch(`${supabaseUrl}/rest/v1/`, {
			headers: {
				// cspell:disable-next-line
				apikey: supabaseKey,
				Authorization: `Bearer ${supabaseKey}`,
			},
		});

		if (response.ok) {
			sWarn("✅ Supabase project is active");
		} else {
			sWarn(`⚠️  Supabase responded with status: ${response.status}`);
		}
	} catch (error) {
		const errorMessage = extractErrorMessage(error, "Unknown error");
		sError("❌ Failed to ping Supabase:", errorMessage);
	}
}

if (import.meta.main) {
	// prefer-top-level-await: use top-level `await` here so async errors are propagated
	await keepAlive();
}
